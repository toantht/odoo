/** @odoo-module **/

import { browser } from '@web/core/browser/browser';
import { registry } from '@web/core/registry';
import core from 'web.core';

export const presenceService = {
    start(env) {
        const LOCAL_STORAGE_PREFIX = 'presence';

        // map window_focus event from the wowlBus to the legacy one.
        env.bus.addEventListener('window_focus', isOdooFocused => {
            core.bus.trigger('window_focus', isOdooFocused);
        });

        let isOdooFocused = true;
        let lastPresenceTime = (
            browser.localStorage.getItem(`${LOCAL_STORAGE_PREFIX}.lastPresence`)
            || new Date().getTime()
        );

        function onPresence() {
            lastPresenceTime = new Date().getTime();
            browser.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}.lastPresence`, lastPresenceTime);
        }

        function onFocusChange(isFocused) {
            try {
                isFocused = parent.document.hasFocus();
            } catch {}
            browser.localStorage.setItem(`${LOCAL_STORAGE_PREFIX}.focus`, isOdooFocused);
            if (isFocused) {
                lastPresenceTime = new Date().getTime();
                env.bus.trigger('window_focus', isOdooFocused);
            }
        }

        function onStorage({ key, newValue }) {
            if (key === `${LOCAL_STORAGE_PREFIX}.focus`) {
                isOdooFocused = JSON.parse(newValue);
                env.bus.trigger('window_focus', newValue);
            }
            if (key === `${LOCAL_STORAGE_PREFIX}.lastPresence`) {
                lastPresenceTime = JSON.parse(newValue);
            }
        }
        browser.addEventListener('storage', onStorage);
        browser.addEventListener('focus', () => onFocusChange(true));
        browser.addEventListener('blur', () => onFocusChange(false));
        browser.addEventListener('pagehide', () => onFocusChange(false));
        browser.addEventListener('click', onPresence);
        browser.addEventListener('keydown', onPresence);

        return {
            getLastPresence() {
                return lastPresenceTime;
            },
            isOdooFocused() {
                return isOdooFocused;
            }
        };
    },
};

registry.category('services').add('presence', presenceService);
