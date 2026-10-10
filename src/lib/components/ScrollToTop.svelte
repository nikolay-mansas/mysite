<script lang='ts'>
	import { onMount } from 'svelte';

	let visible = $state(false);

	const SHOW_AFTER = 400;

	onMount(() => {
		const onScroll = () => {
			visible = window.scrollY > SHOW_AFTER;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function scrollToTop() {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({
			top: 0,
			behavior: reduce ? 'auto' : 'smooth'
		});
	}
</script>

<button
	type='button'
	onclick={scrollToTop}
	aria-label='Back to top'
	title='Back to top'
	class='fixed right-3 top-20 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-surface active:scale-95 sm:right-6 sm:top-24 sm:h-12 sm:w-12 {visible
		? 'pointer-events-auto translate-y-0 opacity-100'
		: 'pointer-events-none -translate-y-2 opacity-0'}'
>
	<svg
		class='h-5 w-5'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		stroke-width='2'
		stroke-linecap='round'
		stroke-linejoin='round'
		aria-hidden='true'
	>
		<path d='M12 19V5M5 12l7-7 7 7' />
	</svg>
</button>