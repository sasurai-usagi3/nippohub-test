Vue.use(VueRouter);

window.addEventListener('load', () => {
  const auth = firebase.auth();
  const database = firebase.database();
  const ui = new firebaseui.auth.AuthUI(auth);
  const normalizeDateElm = x => `0${x}`.slice(-2);
  const routes = [
    {
      path: '/',
      component: {
        template: '<memo-page :date="date" :current-user-id="currentUserId" :memos="memos"></memo-page>',
        props: ['date', 'currentUserId', 'memos']
      },
      props: route => {
        const currentDateStr = route.query.date;
        const currentDate = (currentDateStr != null) ? new Date(currentDateStr) : new Date();

        return {date: currentDate}
      }
    },
    {path: '/sign_in', component: {template: '<auth-page></auth-page>'}}
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
    props: ['memos']
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
  Vue.component('auth-page', {
    template: document.getElementById('js-template-auth-page'),
    props: ['hidden'],
    mounted: function() {
      ui.start('#js-form-auth-area', {
        signInSuccessUrl: '/',
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID
        ]
      });
    }
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
  const currentPath = router.currentRoute.path;
  const btnToSignOut = document.getElementById('js-sign-out');
  const queryStr = location.search.slice(1);
  const queries = (queryStr.length != 0) ? queryStr.split('&').map(x => x.split('=')) : [];
  const paramDate = (queries.find(x => x[0] === 'date') || [])[1];
  const currentDate = (paramDate != null) ? new Date(paramDate) : new Date();
  const beginningOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
  const endOfCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
  const init = userId => {
    database.ref(`users/${userId}/memos`).orderByChild('timestamp').startAt(beginningOfCurrentDate.getTime()).endAt(endOfCurrentDate.getTime()).on('value', r => {
      const data = r.val();

      pageContainer.memos = [];

      for(let v in data) {
        const createdAt = new Date(data[v].timestamp);
        const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
        const contents = data[v].contents;

        pageContainer.memos.push({contents: contents, createdAt: createdAtStr});
      }
    });
  };

  pageContainer.date = currentDate;

  btnToSignOut.addEventListener('click', () => {
    auth.signOut();
  });

  auth.onAuthStateChanged(currentUser => {
    if(currentUser != null) {
      init(currentUser.uid);
      pageContainer.currentUserId = currentUser.uid;
      if(currentPath === '/sign_in') {
        router.push('/');
      }
    } else {
      if(currentPath === '/') {
        router.push('/sign_in');
      }
    }
  });
});
