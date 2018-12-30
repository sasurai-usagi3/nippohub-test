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

  database.ref('memos').orderByChild('userId').equalTo(userId).on('value', r => {
    const data = r.val();

    for(let i = listMemo.children.length - 1; i >= 0; --i) {
      listMemo.removeChild(listMemo.children[i]);
    }

    for(let v in data) {
      const li = document.createElement('li');

      li.textContent = data[v].contents;
      li.classList.add('p-memo-list__item');

      listMemo.appendChild(li);
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    database.ref('memos').push({
      contents: memoTextField.value,
      userId: userId
    });
    memoTextField.value = '';
  });
};

window.addEventListener('load', () => {
  const btnToSignOut = document.getElementById('js-sign-out');

  btnToSignOut.addEventListener('click', () => {
    auth.signOut();
  });
});
