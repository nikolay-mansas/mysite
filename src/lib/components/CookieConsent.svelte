<script lang='ts'>
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import {
		getConsent,
		setConsent,
		loadYandexMetrika,
		type ConsentValue
	} from '$lib/consent';

	let visible = $state(false);

	onMount(() => {
		const consent = getConsent();
		if (consent === null) {
			visible = true;
		} else if (consent === 'accepted') {
			loadYandexMetrika();
		}
	});

	function choose(value: ConsentValue) {
		setConsent(value);
		visible = false;
		if (value === 'accepted') {
			loadYandexMetrika();
		}
	}

	function handleOpen() {
		visible = true;
	}

    onMount(() => {
		const consent = getConsent();
		if (consent === null) {
			visible = true;
		} else if (consent === 'accepted') {
			loadYandexMetrika();
		}

		window.addEventListener('open-cookie-settings', handleOpen);
		return () => {
			window.removeEventListener('open-cookie-settings', handleOpen);
		};
	});
</script>

{#if visible}
	<div
		class='fixed inset-x-0 bottom-20 z-200 flex justify-center p-3 sm:p-4'
		role='dialog'
		aria-modal='true'
		aria-labelledby='cookie-title'
		aria-describedby='cookie-desc'
	>
		<div
			class='w-full max-w-3xl rounded-2xl border border-border bg-surface p-4 shadow-2xl sm:p-5'
		>
			<div class='flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6'>
				<div class='flex-1'>
					<h2
						id='cookie-title'
						class='text-base font-semibold tracking-tight text-foreground'
					>
						{m.cookie_title()}
					</h2>
					<p
						id='cookie-desc'
						class='mt-1.5 text-sm leading-relaxed text-muted'
					>
						{m.cookie_body()}
					</p>
				</div>

				<div class='flex shrink-0 gap-2'>
					<button
						type='button'
						onclick={() => choose('declined')}
						class='cursor-pointer rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
					>
						{m.cookie_decline()}
					</button>
					<button
						type='button'
						onclick={() => choose('accepted')}
						class='cursor-pointer rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
					>
						{m.cookie_accept()}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}