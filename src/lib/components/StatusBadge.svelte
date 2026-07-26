<script lang="ts">
	import { IS_ONLINE } from '$lib/config';
	import { m } from '$lib/paraglide/messages';

	let { class: className = '' }: { class?: string } = $props();
</script>

<div
	class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium {className}"
>
	<span class="relative flex h-2.5 w-2.5">
		{#if IS_ONLINE}
			<span
				class="absolute inline-flex h-full w-full rounded-full bg-online"
				style="animation: pulse-ring 2s cubic-bezier(0,0,0.2,1) infinite"
			></span>
		{/if}
		<span
			class="relative inline-flex h-2.5 w-2.5 rounded-full {IS_ONLINE
				? 'bg-online'
				: 'bg-offline'}"
		></span>
	</span>
	<span class={IS_ONLINE ? 'text-foreground' : 'text-muted'}>
		{IS_ONLINE ? m.status_online() : m.status_offline()}
	</span>
</div>
