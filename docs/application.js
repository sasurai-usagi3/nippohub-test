Vue.use(VueRouter);

window.addEventListener('load', () => {
  const auth = firebase.auth();

  // NOTE: undescribeを内部で呼び出すことで擬似的にユーザ状態を読み込めた時に発火するイベントハンドラを作成している
  const undescribe = auth.onAuthStateChanged(currentUser => {
    const database = firebase.database();
    const ui = new firebaseui.auth.AuthUI(auth);
    const normalizeDateElm = x => `0${x}`.slice(-2);
    const memoPage = {
      template: '<memo-page :date="date" :current-user-id="currentUserId" :memos="memos"></memo-page>',
      props: ['date', 'currentUserId', 'memos'],
      beforeRouteEnter: function(to, from, next) {
        const currentUser = auth.currentUser;

        if(currentUser == null) {
          router.push('/sign_in');
          return;
        }
        next();
      }
    };
    const signInPage = {
      template: '<sign-in-page></sign-in-page>',
      beforeRouteEnter: function(to, from, next) {
        const currentUser = auth.currentUser;

        if(currentUser != null) {
          router.push('/');
          return;
        }
        next();
      }
    };
    const signUpPage = {
      template: '<sign-up-page></sign-up-page>',
      beforeRouteEnter: function(to, from, next) {
        const currentUser = auth.currentUser;

        if(currentUser != null) {
          router.push('/');
          return;
        }
        next();
      }
    }
    const routes = [
      {
        path: '/',
        component: memoPage,
        props: route => {
          const currentDateStr = route.query.date;
          const currentDate = (currentDateStr != null) ? new Date(currentDateStr) : new Date();

          return {date: currentDate}
        }
      },
      {path: '/sign_in', component: signInPage},
      {path: '/sign_up', component: signUpPage}
    ];
    const router = new VueRouter({routes});
    Vue.component('memo-form', {
      template: document.getElementById('js-template-form-memo'),
      props: ['currentUserId', 'hidden'],
      methods: {
        submit: function() {
          const memoTextField = document.getElementById('js-content-text-field');
          const userId = this.currentUserId;

          database.ref(`users/${userId}/memos`).push({
            contents: memoTextField.value,
            userId: userId,
            timestamp: Date.now()
          });
          memoTextField.value = '';
        }
      }
    });
    Vue.component('memo-list', {
      template: document.getElementById('js-template-memo-list').innerHTML,
      data: function() {
        return {memos: []}
      },
      props: ['date', 'currentUserId'],
      watch: {
        date: function() {
          const beginningOfCurrentDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0);
          const endOfCurrentDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 23, 59, 59, 999);
          database.ref(`users/${this.currentUserId}/memos`).off('value');
          database.ref(`users/${this.currentUserId}/memos`).orderByChild('timestamp').startAt(beginningOfCurrentDate.getTime()).endAt(endOfCurrentDate.getTime()).on('value', r => {
            const data = r.val();
            let memos = [];

            for(let v in data) {
              const createdAt = new Date(data[v].timestamp);
              const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
              const contents = data[v].contents;

              memos.push({contents: contents, createdAt: createdAtStr});
            }

            this.memos = memos;
          });
        }
      }
    });
    Vue.component('memo-page', {
      template: document.getElementById('js-template-memo-page'),
      props: ['currentUserId', 'hidden', 'date', 'memos'],
      computed: {
        dateStr: function() {
          return (this.date != null) ? `${this.date.getFullYear()}-${normalizeDateElm(this.date.getMonth() + 1)}-${normalizeDateElm(this.date.getDate())}` : 'xxxx-xx-xx';
        },
        previousDateUrl: function() {
          if(this.date == null) {
            return '/#/';
          }

          const previousDay = new Date(this.date.getTime() - 24 * 3600 * 1000);

          return `/#/?date=${previousDay.getFullYear()}-${normalizeDateElm(previousDay.getMonth() + 1)}-${normalizeDateElm(previousDay.getDate())}`;
        },
        nextDateUrl: function() {
          if(this.date == null) {
            return '/#/';
          }

          const nextDay = new Date(this.date.getTime() + 24 * 3600 * 1000);

          return `/#/?date=${nextDay.getFullYear()}-${normalizeDateElm(nextDay.getMonth() + 1)}-${normalizeDateElm(nextDay.getDate())}`;
        },
        isToday: function() {
          const today = new Date();
          const date = this.date;

          return date != null && date.getYear() === today.getYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
        }
      },
      methods: {
        summaryMemos: function() {
          const contentsDOM = document.querySelectorAll('.js-memo-contents');
          const summaryArea = document.getElementById('js-summary-area');
          let contents = '';

          contentsDOM.forEach(x => {
            contents += `${x.textContent}\n`;
          });

          summaryArea.value = contents;
          modal.hidden = false;
        }
      }
    });
    Vue.component('sign-in-form', {
      template: document.getElementById('js-template-auth'),
      data: function() {
        return {email: '', password: ''};
      },
      methods: {
        signIn: function() {
          auth.signInWithEmailAndPassword(this.email, this.password).then(() => {
            router.push('/');
          }).catch(e => {
            // TODO: auth/wrong-passwordの時の処理
            // TODO: auth/user-not-foundの時の処理
            console.log(e.code);
            console.log(e.message);
          });
        }
      }
    });
    Vue.component('sign-up-form', {
      template: document.getElementById('js-template-auth'),
      data: function() {
        return {email: '', password: ''};
      },
      methods: {
        signIn: function() {
          auth.createUserWithEmailAndPassword(this.email, this.password).then(() => {
            router.push('/');
          }).catch(e => {
            // TODO: auth/email-already-in-useの時の処理
            console.log(e.code);
            console.log(e.message);
          });
        }
      }
    });
    Vue.component('sign-in-page', {
      template: document.getElementById('js-template-sign-in-page')
    });
    Vue.component('sign-up-page', {
      template: document.getElementById('js-template-sign-up-page')
    });
    const pageContainer = new Vue({
      el: '#js-page-container',
      data: {
        currentUserId: null,
        date: null,
        memos: []
      },
      router
    });
    const modal = new Vue({
      el: '#js-modal',
      data: {
        hidden: true
      },
      methods: {
        close: function() {
          this.hidden = true;
        }
      }
    });
    const btnToSignOut = document.getElementById('js-sign-out');

    btnToSignOut.addEventListener('click', () => {
      auth.signOut();
      router.push('/sign_in');
    });

    auth.onAuthStateChanged(currentUser => {
      pageContainer.currentUserId = (currentUser != null) ? currentUser.uid : null;
    });

    undescribe(); // NOTE: 自らをundescribeする
  });
});
