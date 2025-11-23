CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`title` varchar(255) NOT NULL,
	`type` enum('es_deadline','interview','test','briefing','other') NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp,
	`location` text,
	`memo` text,
	`remindBeforeDays` smallint NOT NULL DEFAULT 1,
	`remindOnDay` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_events_user_date` ON `events` (`userId`,`startAt`);
--> statement-breakpoint
CREATE INDEX `idx_events_user_company` ON `events` (`userId`,`companyId`,`startAt`);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`overrideEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `selection_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`order` smallint NOT NULL,
	`name` varchar(100) NOT NULL,
	`status` enum('not_started','scheduled','in_review','passed','failed') NOT NULL DEFAULT 'not_started',
	`plannedDate` date,
	`actualDate` date,
	`memo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `selection_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_selection_steps_company` ON `selection_steps` (`userId`,`companyId`,`order`);
--> statement-breakpoint
CREATE INDEX `idx_selection_steps_status` ON `selection_steps` (`userId`,`companyId`,`status`);
--> statement-breakpoint
ALTER TABLE `companies` MODIFY `status` varchar(50) NOT NULL DEFAULT '未エントリー';
--> statement-breakpoint
UPDATE `companies` SET `status` = '未エントリー' WHERE `status` = '未応募';
