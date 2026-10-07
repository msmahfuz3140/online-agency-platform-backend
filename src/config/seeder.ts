import Service from "../models/Service.js";
import Project from "../models/Project.js";
import TeamMember from "../models/TeamMember.js";
import BlogPost from "../models/BlogPost.js";
import { getMongoClient } from "./db.js";
import { hashPassword } from "better-auth/crypto";

import { servicesData } from "../data/services.data.js";
import { projectsData } from "../data/projects.data.js";
import { teamMembersData } from "../data/team.data.js";
import { blogPosts } from "../data/blog.data.js";

/**
 * Ensures the primary superadmin account is always seeded and verified in MongoDB.
 */
export async function seedMainAdmin(): Promise<void> {
  const adminEmails = ["mdmahfuzulhaque3140@gmail.com", "mdmahfuzulhaque314@gmail.com"];
  const adminPass = "Ms31403140@@";
  const adminName = "MD.MAHFUZUL HAQUE";
  const adminRole = "superadmin";

  try {
    const client = getMongoClient();
    const db = client.db(process.env.MONGODB_DB_NAME || "agency-platform");

    let hashedPassword = adminPass;
    try {
      hashedPassword = await hashPassword(adminPass);
    } catch (hErr) {
      console.warn("Could not hash admin password with crypto:", hErr);
    }

    for (const adminEmail of adminEmails) {
      let userDoc = await db.collection("user").findOne({ email: adminEmail });
      if (!userDoc) {
        userDoc = await db.collection("users").findOne({ email: adminEmail });
      }

      const userId = userDoc?._id?.toString() || userDoc?.id || `admin_${Date.now()}`;
      const userObjId = userDoc?._id;

      // 1. Upsert into "user" collection
      await db.collection("user").updateOne(
        { email: adminEmail },
        {
          $set: {
            id: userId,
            name: adminName,
            email: adminEmail,
            role: adminRole,
            aiCreditsRemaining: 999,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            _id: userObjId || (userId as any),
            emailVerified: true,
            image: null,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 2. Also upsert into "users" collection (for plural compatibility)
      await db.collection("users").updateOne(
        { email: adminEmail },
        {
          $set: {
            id: userId,
            name: adminName,
            email: adminEmail,
            role: adminRole,
            aiCreditsRemaining: 999,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            _id: userObjId || (userId as any),
            emailVerified: true,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 3. Ensure credentials accounts in "account" collection
      const filterConditions: any[] = [
        { accountId: adminEmail, providerId: "credential" },
        { userId: userId, providerId: "credential" },
      ];
      if (userObjId) {
        filterConditions.push({ userId: userObjId, providerId: "credential" });
        filterConditions.push({ accountId: userObjId.toString(), providerId: "credential" });
      }

      const updateResult = await db.collection("account").updateMany(
        { $or: filterConditions },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        await db.collection("account").insertOne({
          _id: `acc_admin_${Date.now()}` as any,
          id: `acc_admin_${userId}`,
          userId: userObjId || userId,
          accountId: userId,
          providerId: "credential",
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`👑 [MAIN ADMIN VERIFIED] ${adminEmail} (Role: ${adminRole}) configured with credentials.`);
    }
  } catch (err) {
    console.error("❌ Error seeding main admin account:", err);
  }
}

/**
 * Automatically seeds or updates the database idempotently.
 */
export async function autoSeedDatabase(): Promise<void> {
  try {
    // 0. Seed Main Admin Credentials
    await seedMainAdmin();

    // 1. Seed / Upsert Services
    const serviceCount = await Service.countDocuments();
    if (serviceCount < servicesData.length) {
      console.log(`🌱 Seeding Services collection in MongoDB (${servicesData.length} records)...`);
      for (const service of servicesData) {
        await Service.findOneAndUpdate({ id: service.id }, service, {
          upsert: true,
          new: true,
        });
      }
      console.log(`✅ All ${servicesData.length} services verified & seeded.`);
    } else {
      console.log(`ℹ️ Services collection already populated (${serviceCount} records).`);
    }

    // 2. Seed / Upsert Portfolio Projects
    const projectCount = await Project.countDocuments();
    if (projectCount < projectsData.length) {
      console.log(`🌱 Seeding Portfolio Projects in MongoDB (${projectsData.length} records)...`);
      for (const project of projectsData) {
        await Project.findOneAndUpdate({ id: project.id }, project, {
          upsert: true,
          new: true,
        });
      }
      console.log(`✅ All ${projectsData.length} projects verified & seeded.`);
    } else {
      console.log(`ℹ️ Portfolio collection already populated (${projectCount} records).`);
    }

    // 3. Seed / Upsert Team Members
    const teamCount = await TeamMember.countDocuments();
    if (teamCount !== teamMembersData.length) {
      console.log(`🌱 Seeding Team Members in MongoDB (${teamMembersData.length} records)...`);
      for (let i = 0; i < teamMembersData.length; i++) {
        const member = teamMembersData[i];
        await TeamMember.findOneAndUpdate(
          { slug: member.slug },
          { ...member, order: i + 1 },
          { upsert: true, new: true }
        );
      }
      console.log(`✅ All ${teamMembersData.length} team members verified & seeded.`);
    } else {
      console.log(`ℹ️ Team collection already populated (${teamCount} records).`);
    }

    // 4. Seed / Upsert Blog Posts
    const blogCount = await BlogPost.countDocuments();
    if (blogCount < blogPosts.length) {
      console.log(`🌱 Seeding Blog Posts in MongoDB (${blogPosts.length} records)...`);
      for (let i = 0; i < blogPosts.length; i++) {
        const post = blogPosts[i];
        await BlogPost.findOneAndUpdate(
          { slug: post.slug },
          { ...post, order: i + 1 },
          { upsert: true, new: true }
        );
      }
      console.log(`✅ All ${blogPosts.length} blog posts verified & seeded.`);
    } else {
      console.log(`ℹ️ Blog collection already populated (${blogCount} records).`);
    }
  } catch (error) {
    console.error("❌ Error during auto-seeding:", error);
  }
}

/**
 * Force-reseed all data (clears and re-populates).
 */
export async function forceSeedDatabase(): Promise<void> {
  console.log("🔄 Force-reseeding all project data...");
  await Service.deleteMany({});
  await Project.deleteMany({});
  await TeamMember.deleteMany({});
  await BlogPost.deleteMany({});

  for (const s of servicesData) {
    await Service.create(s);
  }
  for (const p of projectsData) {
    await Project.create(p);
  }
  for (let i = 0; i < teamMembersData.length; i++) {
    await TeamMember.create({ ...teamMembersData[i], order: i + 1 });
  }
  for (let i = 0; i < blogPosts.length; i++) {
    await BlogPost.create({ ...blogPosts[i], order: i + 1 });
  }
  console.log("✅ All collections force-reseeded successfully.");
}
