<script lang='ts'>
	import { m } from '$lib/paraglide/messages';

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { text, copiedKey, keyName, class: klass = '' }: {
		text: string;
		copiedKey: string | null;
		keyName: string;
		class?: string;
	} = $props();

	let localCopied = $state(false);

	async function doCopy() {
		try {
			await navigator.clipboard.writeText(text);
			localCopied = true;
			setTimeout(() => (localCopied = false), 1200);
		} catch {
			/* clipboard blocked */
		}
	}
</script>

<button
	type='button'
	class='shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground {klass}'
	onclick={doCopy}
>
	{localCopied ? m.tools_copied() : m.tools_copy()}
</button>