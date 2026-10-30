"use client";

import { startTransition, type FormEvent } from "react";

/**
 * onSubmit handler for forms driven by `useActionState` (audit-2 N5).
 *
 * React 19 resets a `<form action={…}>` after every action, also when the action
 * returned an error. Uncontrolled fields go blank and controlled radios/checkboxes
 * lose their DOM state while React state still holds the old value (the next submit
 * then sends nothing). Dispatching the action ourselves inside a transition skips
 * that reset, so everything typed survives a server-side error.
 *
 * Keep `action={dispatch}` on the form as well: before hydration the browser posts
 * natively (progressive enhancement); after hydration `preventDefault()` here means
 * React does not run the form action a second time. Use the `isPending` value of
 * `useActionState` for the button (useFormStatus does not see this submit).
 * Forms that should clear after success reset themselves (e.g. `form.reset()` or a `key`).
 */
export function keepValuesOnSubmit(dispatch: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const formData = submitter ? new FormData(e.currentTarget, submitter) : new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
