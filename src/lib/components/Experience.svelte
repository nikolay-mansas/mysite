<script lang="ts">
  import { EXPERIENCES } from '$lib/config';
  import { m } from '$lib/paraglide/messages';

  const t = (key: string) => (m as Record<string, () => string>)[key]?.() ?? '';
</script>

<section id="experience" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-16 sm:px-6">
  <div class="mb-10">
    <h2 class="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
      {m.experience_heading()}
    </h2>
    <p class="mt-3 text-pretty leading-relaxed text-muted">
      {m.experience_subheading()}
    </p>
  </div>

  <div class="relative">
    <!-- Тонкая линия -->
    <div class="absolute left-4 top-2 h-full w-px bg-border/30 sm:left-6"></div>

    <ul class="space-y-12">
      {#each EXPERIENCES as exp (exp.id)}
        <li class="relative pl-10 sm:pl-14">
          <!-- Точка -->
          <div class="absolute left-0 top-1.5 flex items-center justify-center sm:left-1.5">
            <div
              class="relative flex h-3 w-3 items-center justify-center rounded-full border-2 bg-surface transition-all duration-300
              {exp.current ? 'border-accent' : 'border-border/60'}
              hover:scale-110"
            >
              <!-- Внутренняя точка (акцент для текущей, иначе прозрачная) -->
              {#if exp.current}
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                <!-- Мягкое свечение для текущей -->
                <span
                  class="absolute -inset-1.5 rounded-full bg-accent/10 animate-pulse"
                  style="animation-duration: 2s;"
                ></span>
              {/if}
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-start sm:gap-6">
            <time class="text-sm font-mono text-muted/70 sm:w-32 sm:shrink-0">
              {t(exp.periodKey)}
            </time>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold text-foreground">
                  {#if exp.link}
                    <a
                      href={exp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="hover:underline hover:text-accent transition-colors"
                    >
                      {t(exp.companyKey)}
                    </a>
                  {:else}
                    {t(exp.companyKey)}
                  {/if}
                </h3>
                {#if exp.current}
                  <span
                    class="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent"
                  >
                    {m.experience_current()}
                  </span>
                {/if}
              </div>
              <p class="text-sm text-muted/80">{t(exp.roleKey)}</p>
              <p class="mt-2 text-sm leading-relaxed text-foreground/70">
                {t(exp.descriptionKey)}
              </p>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</section>