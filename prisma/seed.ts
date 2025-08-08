import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";
import { join } from "path";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Projects } from "../src/lib/data/projects.js";
import { Recipes } from "../src/lib/data/recipes.js";
import { Tags } from "../src/lib/data/tags.js";

const prisma = new PrismaClient();

interface RecipeFrontmatter {
  title: string;
  shortId: string;
  projects?: string[];
  tags?: string[];
}

async function findOrCreateTag(name: string) {
  try {
    return await Tags.create({ name });
  } catch (error) {
    // Tag might already exist
    const existing = await prisma.tag.findFirst({
      where: { name, deletedAt: null },
    });
    if (existing) return existing;
    throw error;
  }
}

async function findOrCreateProject(title: string, shortId: string) {
  // First try to find existing project by shortId or title
  const existing = await prisma.project.findFirst({
    where: {
      OR: [
        { shortId, deletedAt: null },
        { title: { equals: title, mode: "insensitive" }, deletedAt: null },
      ],
    },
  });

  if (existing) return existing;

  // If not found, create new project
  try {
    return await Projects.create({
      title,
      shortId,
      description: `Project for ${title}`,
    });
  } catch (error) {
    // If creation fails, try one more lookup in case of race condition
    const existingAfterError = await prisma.project.findFirst({
      where: {
        OR: [
          { shortId, deletedAt: null },
          { title: { equals: title, mode: "insensitive" }, deletedAt: null },
        ],
      },
    });
    if (existingAfterError) return existingAfterError;
    throw error;
  }
}

async function processMarkdownFiles() {
  const seedsDir = join(process.cwd(), "prisma", "seeds");
  const files = readdirSync(seedsDir).filter((file) => file.endsWith(".md"));

  console.log(`📄 Found ${files.length} markdown files to process...`);

  const createdRecipes = [];
  const processedTags = new Map();
  const processedProjects = new Map();

  for (const file of files) {
    const filePath = join(seedsDir, file);
    const fileContent = readFileSync(filePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    const { title, shortId, projects = [], tags = [] } = frontmatter as RecipeFrontmatter;

    if (!title || !shortId) {
      console.log(`  ⚠️  Skipping ${file}: missing title or shortId in frontmatter`);
      continue;
    }

    console.log(`  📝 Processing: ${title}`);

    // Create or find tags
    const tagIds = [];
    for (const tagName of tags) {
      if (!processedTags.has(tagName)) {
        try {
          const tag = await findOrCreateTag(tagName);
          processedTags.set(tagName, tag);
          console.log(`    ✅ Tag: ${tagName}`);
        } catch (error) {
          console.log(`    ⚠️  Failed to create tag: ${tagName}`);
          continue;
        }
      }
      tagIds.push(processedTags.get(tagName).id);
    }

    // Create or find projects
    const projectIds = [];
    for (const projectTitle of projects) {
      const projectShortId = projectTitle.toLowerCase().replace(/\s+/g, "-");
      const projectKey = `${projectTitle}:${projectShortId}`;

      if (!processedProjects.has(projectKey)) {
        try {
          const project = await findOrCreateProject(projectTitle, projectShortId);
          processedProjects.set(projectKey, project);
          console.log(`    ✅ Project: ${projectTitle}`);
        } catch (error) {
          console.log(`    ⚠️  Failed to create project: ${projectTitle}`);
          continue;
        }
      }
      projectIds.push(processedProjects.get(projectKey).id);
    }

    // Create recipe
    try {
      const recipe = await Recipes.create(
        { title, shortId },
        {
          title,
          content,
          tagIds,
          projectIds,
        },
      );

      createdRecipes.push(recipe);
      console.log(`    ✅ Created recipe: ${title}`);
    } catch (error) {
      console.log(`    ⚠️  Recipe "${title}" might already exist or failed to create`);
      console.log(`    Error: ${error}`);
    }
  }

  return {
    createdRecipes,
    createdTags: Array.from(processedTags.values()),
    createdProjects: Array.from(processedProjects.values()),
  };
}

export async function main() {
  console.log("🌱 Starting database seed from markdown files...");

  const { createdRecipes, createdTags, createdProjects } = await processMarkdownFiles();

  console.log("\n🎉 Database seeding completed!");
  console.log(`📊 Summary:`);
  console.log(`  - Tags: ${createdTags.length}`);
  console.log(`  - Projects: ${createdProjects.length}`);
  console.log(`  - Recipes: ${createdRecipes.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
