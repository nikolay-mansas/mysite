/**
 * =============================================================================
 *  SITE CONFIGURATION
 * =============================================================================
 *  This is the ONE file you edit to control the site's data:
 *    - Online status
 *    - Social media accounts (add/remove freely)
 *    - S3 media base URL
 *    - Projects / experience
 *
 *  All human-readable TEXT (titles, descriptions) lives in the translation
 *  files instead:  messages/en.json  and  messages/ru.json
 *  Each project below points to translation keys via `titleKey`, `shortKey`,
 *  and `longKey`, so the content stays fully bilingual.
 * =============================================================================
 */

import type { Component } from "svelte";
import Telegram from "$lib/icons/Telegram.svelte";
import Discord from "$lib/icons/Discord.svelte";
// import Github from "$lib/icons/Github.svelte";
import Mail from "$lib/icons/Mail.svelte";

/* -------------------------------------------------------------------------- */
/*  ONLINE STATUS                                                             */
/*  Flip this boolean to show yourself as online / offline.                   */
/* -------------------------------------------------------------------------- */
export const IS_ONLINE = true;

/* -------------------------------------------------------------------------- */
/*  S3 PUBLIC MEDIA                                                           */
/*  Set your public S3 base URL. Each project image below is just a filename  */
/*  that gets appended to this base. Change the base once and everything      */
/*  updates. You can also set PUBLIC_S3_BASE_URL as an env var to override.   */
/* -------------------------------------------------------------------------- */
import { PUBLIC_S3_BASE_URL } from "$env/static/public";

// Falls back to the bundled local `/media` folder so the site renders out of
// the box. Point PUBLIC_S3_BASE_URL at your real bucket to serve from S3.
export const S3_BASE_URL = PUBLIC_S3_BASE_URL || "/media";

/** Build a full media URL from a filename stored in your S3 bucket. */
export function s3(file: string): string {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${S3_BASE_URL.replace(/\/$/, "")}/${file.replace(/^\//, "")}`;
}

/* -------------------------------------------------------------------------- */
/*  SOCIAL ACCOUNTS                                                           */
/*  Add as many as you like — just append to this array. Each renders as a    */
/*  button automatically. To add a new network, drop a new icon component in  */
/*  src/lib/icons/ and reference it here.                                     */
/* -------------------------------------------------------------------------- */
export interface Social {
  name: string;
  url: string;
  handle: string;
  icon: Component;
}

export const SOCIALS: Social[] = [
  {
    name: "Telegram",
    handle: "@kira_worker",
    url: "https://t.me/kira_worker",
    icon: Telegram,
  },
  {
    name: "Discord",
    handle: "DDKira",
    url: "https://discord.com/users/892096651341221888",
    icon: Discord,
  },
  // {
  //   name: "GitHub",
  //   handle: "yourhandle",
  //   url: "https://github.com/yourhandle",
  //   icon: Github,
  // },
  {
    name: "Email",
    handle: "im@ddkira.ru",
    url: "mailto:im@ddkira.ru",
    icon: Mail,
  },
];

/* -------------------------------------------------------------------------- */
/*  PROJECTS / EXPERIENCE                                                     */
/*  `image` is an OPTIONAL filename in your S3 bucket (leave "" for none).    */
/*  Text keys map to messages/en.json + messages/ru.json.                     */
/* -------------------------------------------------------------------------- */
export interface Project {
  id: string;
  titleKey: string;
  shortKey: string;
  longKey: string;
  /** "solo" or "team" */
  role: "solo" | "team";
  /** Optional S3 image filename, e.g. "projects/dashboard.jpg". "" = no image */
  image: string;
  /** Optional external link. "" = hide the visit button. */
  link: string;
  /** Tech tags shown as chips. */
  tags: string[];
  year: string;
}

export const PROJECTS: Project[] = [
  {
    id: "project-1",
    titleKey: "project_1_title",
    shortKey: "project_1_short",
    longKey: "project_1_long",
    role: "team",
    image: "projects/aerodar_ozon.webp",
    link: "https://www.aerodar.ru/",
    tags: ["FastAPI", "PostgreSQL", "SQLAlchemy", "REST API"],
    year: "2025",
  },
  {
    id: "project-2",
    titleKey: "project_2_title",
    shortKey: "project_2_short",
    longKey: "project_2_long",
    role: "team",
    image: "projects/telegram-phone.webp",
    link: "",
    tags: ["Python", "FFmpeg", "Multithreading", "Celery", "Redis", "aiogram-dialog"],
    year: "2022",
  },
  {
    id: "project-3",
    titleKey: "project_3_title",
    shortKey: "project_3_short",
    longKey: "project_3_long",
    role: "solo",
    image: "projects/animeviewer.webp",
    link: "",
    tags: ["Fastapi", "Svelte5", "REST API", "SQLAlchemy", "PostgreSQL", "Redis"],
    year: "2023",
  },
  {
    id: "project-4",
    titleKey: "project_4_title",
    shortKey: "project_4_short",
    longKey: "project_4_long",
    role: "solo",
    image: "projects/x5group.webp",
    link: "https://www.aerodar.ru/",
    tags: ["Fastapi", "REST API", "SQLAlchemy", "PostgreSQL", "Redis"],
    year: "2025",
  },
  {
    id: "project-5",
    titleKey: "project_5_title",
    shortKey: "project_5_short",
    longKey: "project_5_long",
    role: "solo",
    image: "projects/amocrm.webp",
    link: "",
    tags: ["Python", "Httpx", "Async", "PostgreSQL", "Redis"],
    year: "2024",
  },
  {
    id: "project-6",
    titleKey: "project_6_title",
    shortKey: "project_6_short",
    longKey: "project_6_long",
    role: "solo",
    image: "projects/wb-bot.webp",
    link: "",
    tags: ["Python", "Aiogram", "SQLAlchemy", "aiogram-dialog", "PostgreSQL", "Redis", "Cryptography"],
    year: "2026",
  },
  {
    id: "project-7",
    titleKey: "project_7_title",
    shortKey: "project_7_short",
    longKey: "project_7_long",
    role: "solo",
    image: "projects/sik_rasp.webp",
    link: "https://xn--h1aet.su",
    tags: ["Aiogram", "SQLAlchemy", "aiogram-dialog", "PostgreSQL", "Redis", "RabbitMQ", "K8S"],
    year: "2026",
  },
];

/* -------------------------------------------------------------------------- */
/*  SITE / SEO                                                                */
/* -------------------------------------------------------------------------- */
export const SITE = {
  url: "https://ddkira.ru",
  twitter: "@DDKira",
  ogImage: "og-cover.png",
  keywords: 'Python developer, Backend engineer, FastAPI, PostgreSQL, high-load, microservices, automation, Svelte, portfolio',
};

export interface Experience {
  id: string;
  companyKey: string;
  roleKey: string;
  periodKey: string;
  descriptionKey: string;
  link?: string;
  current?: boolean;
}

export const EXPERIENCES: Experience[] = [
  {
    id: 'exp1',
    companyKey: 'experience.company1',
    roleKey: 'experience.role1',
    periodKey: 'experience.period1',
    descriptionKey: 'experience.desc1',
    current: false,
  },
  {
    id: 'exp2',
    companyKey: 'experience.company2',
    roleKey: 'experience.role2',
    periodKey: 'experience.period2',
    descriptionKey: 'experience.desc2',
    link: 'https://www.aerodar.ru/',
  },
  {
    id: 'exp3',
    companyKey: 'experience.company3',
    roleKey: 'experience.role3',
    periodKey: 'experience.period3',
    descriptionKey: 'experience.desc3',
  },
  {
    id: 'exp4',
    companyKey: 'experience.company4',
    roleKey: 'experience.role4',
    periodKey: 'experience.period4',
    descriptionKey: 'experience.desc4',
  },
  {
    id: 'exp5',
    companyKey: 'experience.company5',
    roleKey: 'experience.role5',
    periodKey: 'experience.period5',
    descriptionKey: 'experience.desc5',
  },
];

export const SKILLS = [
  'Python',
  'FastAPI',
  'PostgreSQL',
  'Redis',
  'SQLAlchemy',
  'REST API',
  'Async Programming',
  'Docker',
  'Linux',
  'Git',
  'CI/CD (GitHub Actions)',
  'K8S',
  'RabbitMQ',
  'GRPC'
];
