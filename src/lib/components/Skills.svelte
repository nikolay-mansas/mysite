<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	const skills = [
		'Python', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Redis',
		'Celery', 'Asyncio', 'Aiogram', 'Svelte 5', 'Tailwind CSS',
		'Docker', 'Linux', 'Git', 'K8S', 'RabbitMQ', 'GRPC', 'Alembic',
        'Asyncpg', 'Uvicorn/Gunicorn', 'MongoDB', 'S3', 'ClickHouse',
        'CI/CD', 'Prometheus + Grafana', 'NGINX', 'Vault', 'Proxmox',
        'Bash'
	];
</script>

<section id="skills" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6">
	<div class="rounded-2xl border border-border bg-surface p-6 sm:p-10">
		<h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
			{m.skills_heading()}
		</h2>

		<div class="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8">
			<div>
				<h3 class="mb-4 text-lg font-semibold text-foreground">
					{m.skills_hard()}
				</h3>
				<ul class="flex flex-wrap gap-2">
					{#each skills as skill}
						<li class="rounded-lg bg-surface-hover px-3 py-1.5 font-mono text-sm text-muted transition-colors hover:text-foreground hover:bg-accent/10 border border-transparent hover:border-accent/40">
							{skill}
						</li>
					{/each}
                    <li class="rounded-lg px-3 py-1.5 text-sm italic text-muted">
                        {m.etcetera()}
                    </li>
				</ul>
			</div>

			<div>
				<h3 class="mb-4 text-lg font-semibold text-foreground">
					{m.skills_languages()}
				</h3>
				<ul class="flex flex-col gap-3">
					<li class="flex items-center justify-between rounded-xl border border-border bg-surface-hover px-4 py-3">
						<span class="font-medium text-foreground">{m.lang_ru()}</span>
						<span class="text-sm font-mono text-muted">{m.lang_native()}</span>
					</li>
					<li class="flex items-center justify-between rounded-xl border border-border bg-surface-hover px-4 py-3">
						<span class="font-medium text-foreground">{m.lang_en()}</span>
						<span class="text-sm font-mono text-muted">{m.lang_b2()}</span>
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>
