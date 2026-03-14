"use server";

import {
  requestPasswordResetAction,
  resetPasswordAction,
  resendConfirmationAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "@/app/auth/actions";

export {
  signInAction as signIn,
  signUpAction as signUp,
  signOutAction as signOut,
  resendConfirmationAction as resendConfirmation,
  requestPasswordResetAction as requestPasswordReset,
  resetPasswordAction as resetPassword,
};
