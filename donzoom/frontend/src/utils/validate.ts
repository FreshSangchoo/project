type UserInfomation = {
  email: string;
  password: string;
};

function validateUser(values: UserInfomation) {
  const errors = {
    email: '',
    password: '',
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.';
  }
  if (!(values.password.length >= 9 && values.password.length < 15)) {
    errors.password = '비밀번호는 9~15자 사이로 입력해주세요.';
  }
  return errors;
}

function validateLogin(values: UserInfomation) {
  return validateUser(values);
}

function validateSignup(values: UserInfomation & {passwordConfirm: string}) {
  const errors = validateUser(values);
  const signupErrors = {...errors, passwordConfirm: ''};

  if (values.password !== values.passwordConfirm) {
    signupErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
  }

  return signupErrors;
}

function validateInitAccount(
  values: UserInfomation & {passwordConfirm: string} & {name: string} & {
    nickname: string;
  } & {isParent: boolean},
) {
  const errors = validateUser(values);
  const initAccountErrors = {
    ...errors,
    passwordConfirm: '',
    name: '',
    nickname: '',
    isParent: '',
  };

  return initAccountErrors;
}

function validateAccount() {
  return '';
}

export {
  validateLogin,
  validateSignup,
  validateInitAccount as validateInit,
  validateAccount,
};
