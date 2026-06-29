import type { LucideIcon } from "lucide-react";
import { Boxes, Code2, Gamepad2 } from "lucide-react";

export type Milestone = {
  title: string;
  payout: number;
  status: "Accepted" | "In review" | "Pending";
  evidence: string;
};

export type Campaign = {
  title: string;
  category: string;
  creator: string;
  summary: string;
  raised: number;
  goal: number;
  bond: number;
  reviewWindow: string;
  backers: number;
  riskLimit: string;
  icon: LucideIcon;
  milestones: Milestone[];
};

export const campaigns: Campaign[] = [
  {
    title: "Open Canvas SDK",
    category: "Open-source tools",
    creator: "0x91c7...46db",
    summary: "A lightweight visual editor SDK with public roadmap, examples, and plugin hooks.",
    raised: 8200,
    goal: 10000,
    bond: 1250,
    reviewWindow: "72h",
    backers: 148,
    riskLimit: "First payout capped at 10%",
    icon: Code2,
    milestones: [
      {
        title: "Playable demo and docs",
        payout: 10,
        status: "Accepted",
        evidence: "GitHub release, hosted demo, walkthrough video"
      },
      {
        title: "Plugin API alpha",
        payout: 25,
        status: "In review",
        evidence: "API reference, test coverage, example plugin"
      },
      {
        title: "Public beta",
        payout: 35,
        status: "Pending",
        evidence: "Beta app, feedback board, migration guide"
      },
      {
        title: "Stable release",
        payout: 30,
        status: "Pending",
        evidence: "Version 1.0 tag, changelog, backer access"
      }
    ]
  },
  {
    title: "Aster Arena",
    category: "Indie games",
    creator: "0x42a8...2190",
    summary: "A browser strategy game funded by playable milestone builds instead of promises.",
    raised: 14750,
    goal: 18000,
    bond: 2000,
    reviewWindow: "96h",
    backers: 231,
    riskLimit: "Refund pool includes forfeited bond on rejection",
    icon: Gamepad2,
    milestones: [
      {
        title: "Core loop prototype",
        payout: 12,
        status: "Accepted",
        evidence: "Browser build, three maps, gameplay capture"
      },
      {
        title: "Backer alpha",
        payout: 28,
        status: "Pending",
        evidence: "Closed alpha, issue tracker, changelog"
      },
      {
        title: "Open beta",
        payout: 30,
        status: "Pending",
        evidence: "Public lobby, balancing patch, analytics"
      },
      {
        title: "Launch build",
        payout: 30,
        status: "Pending",
        evidence: "Release build, rewards delivery, source snapshot"
      }
    ]
  },
  {
    title: "Proofdesk",
    category: "SaaS",
    creator: "0x66fd...c812",
    summary: "A public roadmap helpdesk for small teams that proves shipped work before unlocking funds.",
    raised: 5600,
    goal: 7500,
    bond: 900,
    reviewWindow: "72h",
    backers: 84,
    riskLimit: "Creator bond locked before launch",
    icon: Boxes,
    milestones: [
      {
        title: "MVP inbox",
        payout: 15,
        status: "Accepted",
        evidence: "Demo workspace, docs, sample import"
      },
      {
        title: "Team workflows",
        payout: 25,
        status: "Pending",
        evidence: "Role permissions, assignment logic, audit log"
      },
      {
        title: "Public API",
        payout: 30,
        status: "Pending",
        evidence: "OpenAPI spec, SDK, integration tests"
      },
      {
        title: "Production launch",
        payout: 30,
        status: "Pending",
        evidence: "SLA page, billing disabled for backers, support channel"
      }
    ]
  }
];
