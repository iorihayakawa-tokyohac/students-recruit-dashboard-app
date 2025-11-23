CREATE TABLE `company_researches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`companyName` varchar(255) NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`q1Overview` text,
	`q2BusinessModel` text,
	`q3Strengths` text,
	`q4DesiredPosition` text,
	`q5RoleExpectations` text,
	`q6PersonalStrengths` text,
	`q7SelectionFlow` text,
	`q8InterviewCount` text,
	`q9EvaluationPoints` text,
	`q10Motivation` text,
	`q11WhyThisCompany` text,
	`q12ValuesFit` text,
	`q13Concerns` text,
	`q14ResolutionPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_researches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_company_researches_user` ON `company_researches` (`userId`);
--> statement-breakpoint
CREATE INDEX `idx_company_researches_company` ON `company_researches` (`companyId`);
