<script lang='ts'>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';

	let { children } = $props();
</script>

<div class='flex min-h-screen flex-col'>
	<Header />
	<main class='flex-1'>
		<ScrollToTop />
		{@render children()}
	</main>
	<Footer />
</div>
