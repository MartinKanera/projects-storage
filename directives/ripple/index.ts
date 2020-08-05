// Styles
import './ripple.sass';

// Utilities
import { VNode, VNodeDirective } from 'vue';

type rippleEvent = MouseEvent | TouchEvent | KeyboardEvent;

const DELAY_RIPPLE = 80;

function transform(el: HTMLElement, value: string) {
  el.style.transform = value;
  el.style.webkitTransform = value;
}

function opacity(el: HTMLElement, value: number) {
  el.style.opacity = value.toString();
}

export interface RippleOptions {
  class?: string;
  center?: boolean;
  circle?: boolean;
}

function isTouchEvent(e: rippleEvent): e is TouchEvent {
  return e.constructor.name === 'TouchEvent';
}

function isKeyboardEvent(e: rippleEvent): e is KeyboardEvent {
  return e.constructor.name === 'KeyboardEvent';
}

const calculate = (e: rippleEvent, el: HTMLElement, value: RippleOptions = {}) => {
  let localX = 0;
  let localY = 0;

  if (!isKeyboardEvent(e)) {
    const offset = el.getBoundingClientRect();
    const target = isTouchEvent(e) ? e.touches[e.touches.length - 1] : e;

    localX = target.clientX - offset.left;
    localY = target.clientY - offset.top;
  }

  let radius = 0;
  let scale = 0.3;
  // @ts-ignore
  if (el._ripple && el._ripple.circle) {
    scale = 0.15;
    radius = el.clientWidth / 2;
    radius = value.center ? radius : radius + Math.sqrt((localX - radius) ** 2 + (localY - radius) ** 2) / 4;
  } else {
    radius = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2) / 2;
  }

  const centerX = `${(el.clientWidth - radius * 2) / 2}px`;
  const centerY = `${(el.clientHeight - radius * 2) / 2}px`;

  const x = value.center ? centerX : `${localX - radius}px`;
  const y = value.center ? centerY : `${localY - radius}px`;

  return { radius, scale, x, y, centerX, centerY };
};

const ripples = {
  /* eslint-disable max-statements */
  show(e: rippleEvent, el: HTMLElement, value: RippleOptions = {}) {
    // @ts-ignore
    if (!el._ripple || !el._ripple.enabled) {
      return;
    }

    const container = document.createElement('span');
    const animation = document.createElement('span');

    container.appendChild(animation);
    container.className = 'ripple-container';

    if (value.class) {
      container.className += ` ${value.class}`;
    }

    const { radius, scale, x, y, centerX, centerY } = calculate(e, el, value);

    const size = `${radius * 2}px`;
    animation.className = 'ripple-animation';
    animation.style.width = size;
    animation.style.height = size;

    el.appendChild(container);

    const computed = window.getComputedStyle(el);
    if (computed && computed.position === 'static') {
      el.style.position = 'relative';
      el.dataset.previousPosition = 'static';
    }

    animation.classList.add('ripple-animation--enter');
    animation.classList.add('ripple-animation--visible');
    transform(animation, `translate(${x}, ${y}) scale3d(${scale},${scale},${scale})`);
    opacity(animation, 0);
    animation.dataset.activated = String(performance.now());

    setTimeout(() => {
      animation.classList.remove('ripple-animation--enter');
      animation.classList.add('ripple-animation--in');
      transform(animation, `translate(${centerX}, ${centerY}) scale3d(1,1,1)`);
      opacity(animation, 0.25);
    }, 0);
  },

  hide(el: HTMLElement | null) {
    // @ts-ignore
    if (!el || !el._ripple || !el._ripple.enabled) return;

    const ripples = el.getElementsByClassName('ripple-animation');

    if (ripples.length === 0) return;
    const animation = ripples[ripples.length - 1];

    // @ts-ignore
    if (animation.dataset.isHiding) return;
    // @ts-ignore
    else animation.dataset.isHiding = 'true';

    // @ts-ignore
    const diff = performance.now() - Number(animation.dataset.activated);
    const delay = Math.max(250 - diff, 0);

    setTimeout(() => {
      animation.classList.remove('ripple-animation--in');
      animation.classList.add('ripple-animation--out');
      // @ts-ignore
      opacity(animation, 0);

      setTimeout(() => {
        const ripples = el.getElementsByClassName('ripple-animation');
        if (ripples.length === 1 && el.dataset.previousPosition) {
          el.style.position = el.dataset.previousPosition;
          delete el.dataset.previousPosition;
        }

        animation.parentNode && el.removeChild(animation.parentNode);
      }, 300);
    }, delay);
  },
};

function isRippleEnabled(value: any): value is true {
  return typeof value === 'undefined' || !!value;
}

function rippleShow(e: rippleEvent) {
  const value: RippleOptions = {};
  const element = e.currentTarget as HTMLElement;
  // @ts-ignore
  if (!element || !element._ripple || element._ripple.touched) return;
  if (isTouchEvent(e)) {
    // @ts-ignore
    element._ripple.touched = true;
    // @ts-ignore
    element._ripple.isTouch = true;
  } else {
    // It's possible for touch events to fire
    // as mouse events on Android/iOS, this
    // will skip the event call if it has
    // already been registered as touch
    // @ts-ignore
    // eslint-disable-next-line no-lonely-if
    if (element._ripple.isTouch) return;
  }
  // @ts-ignore
  value.center = element._ripple.centered || isKeyboardEvent(e);
  // @ts-ignore
  if (element._ripple.class) {
    // @ts-ignore
    value.class = element._ripple.class;
  }

  if (isTouchEvent(e)) {
    // already queued that shows or hides the ripple
    // @ts-ignore
    if (element._ripple.showTimerCommit) return;

    // @ts-ignore
    element._ripple.showTimerCommit = () => {
      ripples.show(e, element, value);
    };
    // @ts-ignore
    element._ripple.showTimer = window.setTimeout(() => {
      // @ts-ignore
      if (element && element._ripple && element._ripple.showTimerCommit) {
        // @ts-ignore
        element._ripple.showTimerCommit();
        // @ts-ignore
        element._ripple.showTimerCommit = null;
      }
    }, DELAY_RIPPLE);
  } else {
    ripples.show(e, element, value);
  }
}

function rippleHide(e: Event) {
  const element = e.currentTarget as HTMLElement | null;
  // @ts-ignore
  if (!element || !element._ripple) return;

  // @ts-ignore
  window.clearTimeout(element._ripple.showTimer);

  // The touch interaction occurs before the show timer is triggered.
  // We still want to show ripple effect.
  // @ts-ignore
  if (e.type === 'touchend' && element._ripple.showTimerCommit) {
    // @ts-ignore
    element._ripple.showTimerCommit();
    // @ts-ignore
    element._ripple.showTimerCommit = null;

    // re-queue ripple hiding
    // @ts-ignore
    element._ripple.showTimer = setTimeout(() => {
      rippleHide(e);
    });
    return;
  }

  window.setTimeout(() => {
    // @ts-ignore
    if (element._ripple) {
      // @ts-ignore
      element._ripple.touched = false;
    }
  });
  ripples.hide(element);
}

function rippleCancelShow(e: MouseEvent | TouchEvent) {
  const element = e.currentTarget as HTMLElement | undefined;

  // @ts-ignore
  if (!element || !element._ripple) return;

  // @ts-ignore
  if (element._ripple.showTimerCommit) {
    // @ts-ignore
    element._ripple.showTimerCommit = null;
  }

  // @ts-ignore
  window.clearTimeout(element._ripple.showTimer);
}

let keyboardRipple = false;

function keyboardRippleShow(e: KeyboardEvent) {
  // @ts-ignore
  // eslint-disable-next-line no-undef
  if (!keyboardRipple && (e.keyCode === keyCodes.enter || e.keyCode === keyCodes.space)) {
    keyboardRipple = true;
    rippleShow(e);
  }
}

function keyboardRippleHide(e: KeyboardEvent) {
  keyboardRipple = false;
  rippleHide(e);
}

function updateRipple(el: HTMLElement, binding: VNodeDirective, wasEnabled: boolean) {
  const enabled = isRippleEnabled(binding.value);
  if (!enabled) {
    ripples.hide(el);
  }
  // @ts-ignore
  el._ripple = el._ripple || {};
  // @ts-ignore
  el._ripple.enabled = enabled;
  const value = binding.value || {};
  if (value.center) {
    // @ts-ignore
    el._ripple.centered = true;
  }
  if (value.class) {
    // @ts-ignore
    el._ripple.class = binding.value.class;
  }
  if (value.circle) {
    // @ts-ignore
    el._ripple.circle = value.circle;
  }
  if (enabled && !wasEnabled) {
    el.addEventListener('touchstart', rippleShow, { passive: true });
    el.addEventListener('touchend', rippleHide, { passive: true });
    el.addEventListener('touchmove', rippleCancelShow, { passive: true });
    el.addEventListener('touchcancel', rippleHide);

    el.addEventListener('mousedown', rippleShow);
    el.addEventListener('mouseup', rippleHide);
    el.addEventListener('mouseleave', rippleHide);

    el.addEventListener('keydown', keyboardRippleShow);
    el.addEventListener('keyup', keyboardRippleHide);

    // Anchor tags can be dragged, causes other hides to fail - #1537
    el.addEventListener('dragstart', rippleHide, { passive: true });
  } else if (!enabled && wasEnabled) {
    removeListeners(el);
  }
}

function removeListeners(el: HTMLElement) {
  el.removeEventListener('mousedown', rippleShow);
  el.removeEventListener('touchstart', rippleShow);
  el.removeEventListener('touchend', rippleHide);
  el.removeEventListener('touchmove', rippleCancelShow);
  el.removeEventListener('touchcancel', rippleHide);
  el.removeEventListener('mouseup', rippleHide);
  el.removeEventListener('mouseleave', rippleHide);
  el.removeEventListener('keydown', keyboardRippleShow);
  el.removeEventListener('keyup', keyboardRippleHide);
  el.removeEventListener('dragstart', rippleHide);
}

function directive(el: HTMLElement, binding: VNodeDirective, _: VNode) {
  updateRipple(el, binding, false);
}

function unbind(el: HTMLElement) {
  // @ts-ignore
  delete el._ripple;
  removeListeners(el);
}

function update(el: HTMLElement, binding: VNodeDirective) {
  if (binding.value === binding.oldValue) {
    return;
  }

  const wasEnabled = isRippleEnabled(binding.oldValue);
  updateRipple(el, binding, wasEnabled);
}

export const Ripple = {
  bind: directive,
  unbind,
  update,
};

export default Ripple;
