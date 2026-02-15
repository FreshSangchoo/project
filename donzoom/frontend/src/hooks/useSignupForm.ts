import {useEffect} from 'react';
import useForm from './useForm';
import {useSignupStore} from '@/stores/useAuthStore';
import {validateSignup} from '@/utils';

interface SignupForm {
  email: string;
  password: string;
  passwordConfirm: string;
}

function useSignupForm() {
  const {
    email,
    password,
    passwordConfirm,
    setEmail,
    setPassword,
    setPasswordConfirm,
  } = useSignupStore();

  const form = useForm<SignupForm>({
    initialValue: {email, password, passwordConfirm},
    validate: validateSignup,
  });

  useEffect(() => {
    form.setValues({email, password, passwordConfirm});
  }, [email, password, passwordConfirm]);

  const getTextInputProps = (name: keyof SignupForm) => {
    const props = form.getTextInputProps(name);
    return {
      ...props,
      onChangeText: (text: string) => {
        props.onChangeText(text);
        switch (name) {
          case 'email':
            setEmail(text);
            break;
          case 'password':
            setPassword(text);
            break;
          case 'passwordConfirm':
            setPasswordConfirm(text);
            break;
        }
      },
    };
  };

  const reset = () => {
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
  };

  return {
    ...form,
    getTextInputProps,
    reset,
  };
}

export default useSignupForm;
