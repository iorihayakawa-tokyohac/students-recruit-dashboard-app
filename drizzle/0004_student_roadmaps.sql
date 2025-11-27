CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`university` varchar(255),
	`graduationYear` smallint,
	`desiredIndustry` varchar(255),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_students_user` ON `students` (`userId`);
--> statement-breakpoint
CREATE TABLE `roadmap_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`entityType` enum('student') NOT NULL DEFAULT 'student',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `roadmap_definitions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `idx_roadmap_definitions_entity` ON `roadmap_definitions` (`entityType`);
--> statement-breakpoint
CREATE TABLE `roadmap_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadmapId` int NOT NULL,
	`order` smallint NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskExamples` text,
	`nextActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_roadmap_steps_roadmap_order` ON `roadmap_steps` (`roadmapId`,`order`);
--> statement-breakpoint
CREATE TABLE `roadmap_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roadmapId` int NOT NULL,
	`entityType` enum('student') NOT NULL DEFAULT 'student',
	`entityId` int NOT NULL,
	`userId` int NOT NULL,
	`currentStepId` int,
	`status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roadmap_instances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_roadmap_instances_entity` ON `roadmap_instances` (`entityType`,`entityId`,`userId`);
--> statement-breakpoint
INSERT INTO `roadmap_definitions` (`id`, `key`, `title`, `description`, `entityType`) VALUES
	(1, 'student_support_default', '就活ロードマップ', '学生本人が自分の進捗を管理するための標準フロー', 'student');
--> statement-breakpoint
INSERT INTO `roadmap_steps` (`id`, `roadmapId`, `order`, `title`, `description`, `taskExamples`, `nextActions`) VALUES
	(1, 1, 1, '自己理解・キャリアの方向性決定', '自己理解を深め、将来像の仮説をつくるフェーズ', '["自己分析","ガクチカ整理","強み弱み整理","将来像のラフ設計"]', '["自己分析シートを埋める","ガクチカを3パターン書き出す","強み3つ/弱み3つをメモする"]'),
	(2, 1, 2, '業界研究・企業研究', '業界や企業を幅広く理解し、受ける候補を整理するフェーズ', '["業界マップを見る","気になる企業をストック","受ける可能性のある企業を一覧化"]', '["気になる企業を5社ピックアップ","業界比較のメモを作成"]'),
	(3, 1, 3, 'ES・書類対策', '提出物の質を高め、締切に備えるフェーズ', '["ESドラフトの作成","自己PR／志望動機を整える","過去応募企業のES管理"]', '["今週提出予定のESを登録","志望動機テンプレートを作成"]'),
	(4, 1, 4, '面接・Webテスト対策', '面接・筆記に備え、アウトプットを磨くフェーズ', '["模擬面接","面接想定問答の作成","Webテスト対策"]', '["想定問答を10問埋める","模擬面接の日程を決める"]'),
	(5, 1, 5, 'エントリー・選考管理', 'エントリー先と日程・締切を整理し、抜け漏れを防ぐフェーズ', '["エントリーした企業一覧","面接日程管理","提出期限のリマインド"]', '["受験企業の締切を入力","面接日程をカレンダーに登録"]'),
	(6, 1, 6, '内定比較・意思決定', '内定を比較し、自分の評価軸で意思決定するフェーズ', '["内定企業一覧","評価軸を使った比較","入社意思の決定"]', '["評価軸シートを作る","意思決定期限を設定する"]'),
	(7, 1, 7, '入社準備', '入社前の手続き・生活準備を進めるフェーズ', '["住まい・書類の準備","提出書類の管理","入社前にやることリスト"]', '["入社前TODOを洗い出す","必要書類をリスト化"]');
--> statement-breakpoint
INSERT INTO `students` (`id`, `userId`, `name`, `university`, `graduationYear`, `desiredIndustry`, `note`) VALUES
	(1, 1, '田中 陽菜', '早稲田大学', 2026, 'IT / コンサル', '成長環境を重視。まずはキャリアヒアリングを希望。'),
	(2, 1, '佐藤 海斗', '京都大学', 2026, 'メーカー / モビリティ', 'プロダクト志向で、実地に近い経験を求めている。');
--> statement-breakpoint
INSERT INTO `roadmap_instances` (`id`, `roadmapId`, `entityType`, `entityId`, `userId`, `currentStepId`, `status`) VALUES
	(1, 1, 'student', 1, 1, 4, 'active'),
	(2, 1, 'student', 2, 1, 3, 'active');
