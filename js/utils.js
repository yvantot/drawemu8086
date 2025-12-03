export function throttle(func, limit) {
	let inThrottle = false;
	return function (...args) {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}
