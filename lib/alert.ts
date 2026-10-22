import { Alert as NativeAlert, AlertButton, Platform } from 'react-native';

// React Native's Alert does nothing on the web, so every alert in the app goes
// through here: native dialogs on phones, the browser's own dialogs on the web.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
      NativeAlert.alert(title, message, buttons);
      return;
    }
    const text = message ? `${title}\n\n${message}` : title;
    const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
    const cancel = (buttons ?? []).find((b) => b.style === 'cancel');

    if (actions.length === 0) {
      window.alert(text);
      return;
    }
    if (actions.length === 1 && !cancel) {
      window.alert(text);
      actions[0].onPress?.();
      return;
    }
    // One action plus Cancel → a yes/no confirm. (Multi-choice menus are
    // avoided on the web by the callers.)
    if (window.confirm(text)) actions[0].onPress?.();
    else cancel?.onPress?.();
  },
};
