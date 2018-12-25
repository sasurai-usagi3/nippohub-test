window.addEventListener('load', () => {
  const database = firebase.database();
  const form = document.getElementById('js-form-memo');
  const memoTextField = document.getElementById('js-content-text-field');

  form.addEventListener('submit', e => {
    e.preventDefault();
    database.ref('memos').push({
      contents: memoTextField.value
    });
    memoTextField.value = '';
  });
});
