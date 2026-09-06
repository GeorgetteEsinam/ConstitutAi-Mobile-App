/**
 * Go back if there is a screen to pop; otherwise land on Home.
 * Tab screens (Search) have no stack history, so goBack() would do nothing.
 */
export function goBackSafely(navigation) {
  if (navigation?.canGoBack()) {
    navigation.goBack();
    return;
  }

  const parent = navigation?.getParent?.();
  if (parent?.canGoBack()) {
    parent.goBack();
    return;
  }

  if (navigation?.navigate) {
    navigation.navigate('Home');
  }
}
