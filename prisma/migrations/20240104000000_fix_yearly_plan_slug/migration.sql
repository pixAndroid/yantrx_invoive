-- Fix typo in Yearly plan slug: 'yealty' -> 'yearly'
UPDATE "plans" SET "slug" = 'yearly' WHERE "name" = 'Yearly' AND "slug" != 'yearly';
