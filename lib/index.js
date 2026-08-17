/**
 * dsh-dynamic-wallpaper — host half.
 *
 * Intentionally a no-op loader entry: the whole feature lives in the
 * browser half (`./client`), picked up by dsh-client-modules through the
 * package's `dsh.client` declaration. All wallpaper preferences are
 * persisted in localStorage (the Host settings wire only exposes an
 * allowlisted set of namespaces to browser clients).
 */

/** Host loader entry for the browser implementation exported from `./client`. */
export function apply() {}
