const auth = firebase.auth();
const ui = new firebaseui.auth.AuthUI(auth);

auth.onAuthStateChanged(currentUser => {
  const pageAuth = document.getElementById('js-page-auth');
  const pageMain = document.getElementById('js-page-main');

  if(currentUser != null) {
    pageAuth.setAttribute('hidden', 'hidden');
    pageMain.removeAttribute('hidden');
    init(currentUser.uid);
  } else {
    ui.start('#js-form-auth-area', {
      signInSuccessUrl: '/',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ]
    });

    return;
  }
});

const init = (userId) => {
  const database = firebase.database();
  const form = document.getElementById('js-form-memo');
  const memoTextField = document.getElementById('js-content-text-field');
  const listMemo = document.getElementById('js-list-memo');
  const normalizeDateElm = x => `0${x}`.slice(-2);
  const today = new Date();
  const beginningOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const summaryArea = document.getElementById('js-summary-area');
  const summaryBtn = document.getElementById('js-summary-btn');

  database.ref(`users/${userId}/memos`).orderByChild('timestamp').startAt(beginningOfToday.getTime()).on('value', r => {
    const data = r.val();

    for(let i = listMemo.children.length - 1; i >= 0; --i) {
      listMemo.removeChild(listMemo.children[i]);
    }

    for(let v in data) {
      const li = document.createElement('li');
      const createdAt = new Date(data[v].timestamp);
      const createdAtStr = `${createdAt.getFullYear()}-${normalizeDateElm(createdAt.getMonth() + 1)}-${normalizeDateElm(createdAt.getDate())} ${normalizeDateElm(createdAt.getHours())}:${normalizeDateElm(createdAt.getMinutes())}:${normalizeDateElm(createdAt.getSeconds())}`;
      const contents = data[v].contents;

      li.textContent = `${createdAtStr} > ${contents}`;
      li.classList.add('p-memo-list__item');

      listMemo.appendChild(li);
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    database.ref(`users/${userId}/memos`).push({
      contents: memoTextField.value,
      userId: userId,
      timestamp: Date.now()
    });
    memoTextField.value = '';
  });

  summaryBtn.addEventListener('click', () => {
    summaryArea.value = 'test';
  });
};

window.addEventListener('load', () => {
  const btnToSignOut = document.getElementById('js-sign-out');

  btnToSignOut.addEventListener('click', () => {
    auth.signOut();
  });
});
