/**
 * WindowListenersMap is an object with optional entries to the possible Window Event Listeners with their assigned
 * callbacks. This way we can encapsulate all the different listeners that a Vue component is using and remove them when
 * the component is destroyed.
 *
 * The types WindowEvent and WindowEventListeners have been created to disable eslint on them because it was complaining
 * about WindowEventMap and EventListeners (although they can be properly used).
 *
 * You can see an example of usage in 20-raycaster.vue
 */
/* eslint-disable no-undef  */
export type WindowEvent = keyof WindowEventMap;
export type WindowEventListener = EventListener;
export type WindowListenersMap = {
    [key in WindowEvent]?: WindowEventListener;
};
/* eslint-enable no-undef */

/**
 * Remove all the Window listeners contained in a WindowListenersMap.
 */
export function removeAllListeners(listeners: WindowListenersMap) {
    Object.entries(listeners).forEach(([eventName, callback]) => {
        window.removeEventListener(
            eventName as WindowEvent,
            callback as WindowEventListener
        );
    });
}
