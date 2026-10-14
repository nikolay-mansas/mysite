<script lang='ts'>
	import { m } from '$lib/paraglide/messages';

	let text = $state('');
	let findPattern = $state('');
	let replaceWith = $state('');
	let useRegex = $state(false);
	let caseSensitive = $state(false);
	let wholeWord = $state(false);
	let replaceNotice = $state<string | null>(null);
	let copied = $state(false);

	const stats = $derived.by(() => {
		const t = text;
		const chars = [...t].length;
		const charsNoSpaces = [...t.replace(/\s/g, '')].length;
		const cyrillic = (t.match(/[а-яёА-ЯЁ]/g) || []).length;
		const latin = (t.match(/[a-zA-Z]/g) || []).length;
		const digits = (t.match(/[0-9]/g) || []).length;
		const spaces = (t.match(/\s/g) || []).length;
		const other = Math.max(0, chars - cyrillic - latin - digits - spaces);
		const words = (t.trim().match(/\S+/g) || []).length;
		const lines = t === '' ? 0 : t.split(/\r\n|\r|\n/).length;
		const sentences = (t.match(/[^.!?…]+[.!?…]+/g) || []).length;
		const paragraphs =
			t.trim() === '' ? 0 : t.trim().split(/\n\s*\n/).filter(Boolean).length;
		const readingTime = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
		return {
			chars,
			charsNoSpaces,
			cyrillic,
			latin,
			digits,
			spaces,
			other,
			words,
			lines,
			sentences,
			paragraphs,
			readingTime
		};
	});

	function escapeRegExp(s: string): string {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function buildRegex(): RegExp | null {
		if (!findPattern) return null;
		let pattern = useRegex ? findPattern : escapeRegExp(findPattern);
		if (wholeWord) pattern = `\\b(?:${pattern})\\b`;
		const flags = caseSensitive ? 'g' : 'gi';
		return new RegExp(pattern, flags);
	}

	const regexError = $derived.by(() => {
		if (!useRegex || !findPattern) return null;
		try {
			new RegExp(findPattern, 'u');
			return null;
		} catch (e) {
			return e instanceof Error ? e.message : String(e);
		}
	});

	const matchCount = $derived.by(() => {
		if (!findPattern || !text) return 0;
		try {
			const re = buildRegex();
			if (!re) return 0;
			return (text.match(re) || []).length;
		} catch {
			return 0;
		}
	});

	function replaceAll() {
		if (!findPattern) return;
		const re = buildRegex();
		if (!re) return;
		const before = text;
		text = text.replace(re, replaceWith);
		replaceNotice =
			before === text ? m.text_replace_no_matches() : m.text_replace_done();
		setTimeout(() => (replaceNotice = null), 2500);
	}

	function clearAll() {
		text = '';
		findPattern = '';
		replaceWith = '';
		replaceNotice = null;
		copied = false;
	}

	function applyTransform(fn: (s: string) => string) {
		text = fn(text);
	}

	function capitalizeFirst(word: string): string {
		if (!word) return word;
		const cps = Array.from(word);
		return (cps[0] ?? '').toUpperCase() + cps.slice(1).join('');
	}

	const toUpper = () => applyTransform((s) => s.toUpperCase());

	const toLower = () => applyTransform((s) => s.toLowerCase());

	const toTitle = () =>
		applyTransform((s) =>
			s.replace(/\S+/gu, (w) => capitalizeFirst(w.toLowerCase()))
		);

	const toSentence = () =>
		applyTransform((s) =>
			s
				.toLowerCase()
				.replace(/(^\s*\p{L}|[.!?…]\s+\p{L})/gu, (mch) => mch.toUpperCase())
		);

	const toToggle = () =>
		applyTransform((s) =>
			Array.from(s)
				.map((ch) => {
					const up = ch.toUpperCase();
					const lo = ch.toLowerCase();
					return ch === up && ch !== lo ? lo : up;
				})
				.join('')
		);

	const trimSpaces = () =>
		applyTransform((s) =>
			s
				.replace(/[ \t]+/g, ' ')
				.replace(/[ \t]+\n/g, '\n')
				.replace(/\n{3,}/g, '\n\n')
				.trim()
		);

	const removeLineBreaks = () => applyTransform((s) => s.replace(/\r?\n+/g, ' '));
	const removeExtraSpaces = () => applyTransform((s) => s.replace(/ {2,}/g, ' '));

	async function copyText() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			/* ignore */
		}
	}

	const statRows = $derived([
		{ key: 'words', label: m.text_stat_words(), value: stats.words },
		{ key: 'chars', label: m.text_stat_chars(), value: stats.chars },
		{ key: 'chars_ns', label: m.text_stat_chars_no_spaces(), value: stats.charsNoSpaces },
		{ key: 'cyr', label: m.text_stat_cyrillic(), value: stats.cyrillic },
		{ key: 'lat', label: m.text_stat_latin(), value: stats.latin },
		{ key: 'digits', label: m.text_stat_digits(), value: stats.digits },
		{ key: 'spaces', label: m.text_stat_spaces(), value: stats.spaces },
		{ key: 'other', label: m.text_stat_other(), value: stats.other },
		{ key: 'lines', label: m.text_stat_lines(), value: stats.lines },
		{ key: 'sentences', label: m.text_stat_sentences(), value: stats.sentences },
		{ key: 'paragraphs', label: m.text_stat_paragraphs(), value: stats.paragraphs }
	]);
</script>

<div class='space-y-5'>
	<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6'>
		<div class='mb-2 flex items-center justify-between'>
			<label
				for='text-input'
				class='block text-xs font-medium uppercase tracking-widest text-muted/70'
			>
				{m.text_input_label()}
			</label>
			<div class='flex items-center gap-2 text-[11px] text-muted/70'>
				<span class='font-mono'>{stats.chars} {m.encode_chars_label()}</span>
				<span class='opacity-40'>·</span>
				<span class='font-mono'>{stats.words} {m.text_stat_words_short()}</span>
			</div>
		</div>
		<textarea
			id='text-input'
			bind:value={text}
			rows='10'
			spellcheck='false'
			placeholder={m.text_input_placeholder()}
			class='w-full resize-y rounded-lg border border-border bg-surface-hover p-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
		></textarea>

		<div class='mt-4 flex flex-wrap gap-2'>
			<button
				type='button'
				onclick={toUpper}
				title={m.text_btn_upper_hint()}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				>ABC</button
			>
			<button
				type='button'
				onclick={toLower}
				title={m.text_btn_lower_hint()}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				>abc</button
			>
			<button
				type='button'
				onclick={toTitle}
				title={m.text_btn_title_hint()}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				>Abc</button
			>
			<button
				type='button'
				onclick={toSentence}
				title={m.text_btn_sentence_hint()}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
			>
				{m.text_btn_sentence()}
			</button>
			<button
				type='button'
				onclick={toToggle}
				title={m.text_btn_toggle_hint()}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
				>aBc</button
			>
			<button
				type='button'
				onclick={trimSpaces}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
			>
				{m.text_btn_trim()}
			</button>
			<button
				type='button'
				onclick={removeLineBreaks}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
			>
				{m.text_btn_remove_breaks()}
			</button>
			<button
				type='button'
				onclick={removeExtraSpaces}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
			>
				{m.text_btn_remove_extra_spaces()}
			</button>
			<button
				type='button'
				onclick={copyText}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground'
			>
				{copied ? m.blog_copied() : m.tools_copy()}
			</button>
			<button
				type='button'
				onclick={clearAll}
				class='rounded-md border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-red-500/40 hover:text-red-400'
			>
				{m.tools_clear()}
			</button>
		</div>
	</div>

	<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6'>
		<h2 class='mb-4 text-sm font-semibold uppercase tracking-widest text-muted/70'>
			{m.text_stats_heading()}
		</h2>
		<div class='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'>
			{#each statRows as row (row.key)}
				<div
					class='flex items-center justify-between rounded-lg border border-border bg-surface-hover px-3 py-2'
				>
					<span class='text-[11px] uppercase tracking-wide text-muted/80'>{row.label}</span>
					<span class='font-mono text-sm text-foreground'>{row.value}</span>
				</div>
			{/each}
			<div
				class='flex items-center justify-between rounded-lg border border-accent/30 bg-surface-hover px-3 py-2'
			>
				<span class='text-[11px] uppercase tracking-wide text-muted/80'>
					{m.text_stat_reading_time()}
				</span>
				<span class='font-mono text-sm text-accent'>
					{stats.readingTime} {m.text_minutes()}
				</span>
			</div>
		</div>
	</div>

	<div class='rounded-2xl border border-border bg-surface p-5 sm:p-6'>
		<div class='mb-4 flex items-center justify-between'>
			<h2 class='text-sm font-semibold uppercase tracking-widest text-muted/70'>
				{m.text_replace_heading()}
			</h2>
			<span class='font-mono text-xs text-muted/70'>
				{m.text_matches()}: <span class='text-foreground'>{matchCount}</span>
			</span>
		</div>

		<div class='space-y-3'>
			<div>
				<label
					for='find-input'
					class='mb-1 block text-[11px] uppercase tracking-wider text-muted/70'
					>{m.text_find_label()}</label
				>
				<input
					id='find-input'
					type='text'
					bind:value={findPattern}
					spellcheck='false'
					placeholder={useRegex ? '\\b\\w+@\\w+\\.\\w+\\b' : m.text_find_placeholder()}
					class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
				/>
			</div>

			<div>
				<label
					for='replace-input'
					class='mb-1 block text-[11px] uppercase tracking-wider text-muted/70'
					>{m.text_replace_label()}</label
				>
				<input
					id='replace-input'
					type='text'
					bind:value={replaceWith}
					spellcheck='false'
					placeholder={useRegex ? '$1 / $2 …' : m.text_replace_placeholder()}
					class='w-full rounded-lg border border-border bg-surface-hover px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent/60'
				/>
			</div>

			<div class='flex flex-wrap items-center gap-3 pt-1'>
				<label class='flex cursor-pointer items-center gap-2 text-xs text-muted'>
					<input type='checkbox' bind:checked={useRegex} class='accent-accent' />
					<span class='font-mono'>{m.text_use_regex()}</span>
				</label>
				<label class='flex cursor-pointer items-center gap-2 text-xs text-muted'>
					<input type='checkbox' bind:checked={caseSensitive} class='accent-accent' />
					<span>{m.text_case_sensitive()}</span>
				</label>
				<label class='flex cursor-pointer items-center gap-2 text-xs text-muted'>
					<input type='checkbox' bind:checked={wholeWord} class='accent-accent' />
					<span>{m.text_whole_word()}</span>
				</label>
			</div>

			{#if regexError}
				<p class='rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400'>
					{m.text_regex_invalid()}: <span class='font-mono'>{regexError}</span>
				</p>
			{/if}

			<div class='flex flex-wrap items-center gap-2 pt-1'>
				<button
					type='button'
					onclick={replaceAll}
					disabled={!findPattern || !!regexError}
					class='rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40'
				>
					{m.text_btn_replace_all()}
				</button>
				{#if replaceNotice}
					<span class='text-xs text-accent/80'>{replaceNotice}</span>
				{/if}
			</div>
		</div>
	</div>
</div>