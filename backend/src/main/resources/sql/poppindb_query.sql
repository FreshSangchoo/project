-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema poppin
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema poppin
-- -----------------------------------------------------

CREATE SCHEMA IF NOT EXISTS `poppin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `poppin` ;

-- -----------------------------------------------------
-- Table `poppin`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`user` (
  `user_tsid` BIGINT NOT NULL,
  `provider_id` VARCHAR(100) NOT NULL,
  `provider_name` VARCHAR(45) NOT NULL,
  `name` VARCHAR(30) NOT NULL,
  `nickname` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `age` INT NOT NULL,
  `gender` VARCHAR(5) NOT NULL,
  `phone_number` VARCHAR(16) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `img` VARCHAR(255) NULL,
  PRIMARY KEY (`user_tsid`),
  UNIQUE INDEX `user_tsid_UNIQUE` (`user_tsid` ASC) VISIBLE,
  UNIQUE INDEX `provider_id_UNIQUE` (`provider_id` ASC) VISIBLE,
  UNIQUE INDEX `nickname_UNIQUE` (`nickname` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`manager`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`manager` (
  `manager_tsid` BIGINT NOT NULL,
  `nickname` VARCHAR(50) NULL,
  `code` VARCHAR(50) NULL,
  `img` VARCHAR(255) NULL,
  PRIMARY KEY (`manager_tsid`),
  UNIQUE INDEX `manager_id_UNIQUE` (`manager_tsid` ASC) VISIBLE,
  UNIQUE INDEX `nickname_UNIQUE` (`nickname` ASC) VISIBLE,
  UNIQUE INDEX `code_UNIQUE` (`code` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`popup`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`popup` (
  `popup_id` INT NOT NULL AUTO_INCREMENT,
  `manager_tsid` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `hours` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `sns_url` VARCHAR(255) NULL,
  `page_url` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `lat` DECIMAL NOT NULL,
  `lon` DECIMAL NOT NULL,
  `heart` INT NULL DEFAULT 0,
  `hit` INT NULL DEFAULT 0,
  `rating` FLOAT NULL DEFAULT 0.0,
  PRIMARY KEY (`popup_id`),
  INDEX `fk_popup_manager_idx` (`manager_tsid` ASC) VISIBLE,
  CONSTRAINT `fk_popup_manager`
    FOREIGN KEY (`manager_tsid`)
    REFERENCES `poppin`.`manager` (`manager_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`category` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(36) NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`popup_category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`popup_category` (
  `popup_category_id` INT NOT NULL AUTO_INCREMENT,
  `popup_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`popup_category_id`),
  INDEX `fk_popup_category_category1_idx` (`category_id` ASC) VISIBLE,
  INDEX `fk_popup_category_popup1_idx` (`popup_id` ASC) VISIBLE,
  CONSTRAINT `fk_popup_category_category1`
    FOREIGN KEY (`category_id`)
    REFERENCES `poppin`.`category` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_popup_category_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`popup_image`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`popup_image` (
  `popup_image_id` INT NOT NULL AUTO_INCREMENT,
  `popup_id` INT NOT NULL,
  `img` VARCHAR(255) NOT NULL,
  `seq` INT NOT NULL,
  PRIMARY KEY (`popup_image_id`),
  INDEX `fk_popup_image_popup1_idx` (`popup_id` ASC) VISIBLE,
  CONSTRAINT `fk_popup_image_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`heart`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`heart` (
  `heart_id` INT NOT NULL AUTO_INCREMENT,
  `user_tsid` BIGINT NOT NULL,
  `popup_id` INT NOT NULL,
  PRIMARY KEY (`heart_id`),
  INDEX `fk_heart_popup1_idx` (`popup_id` ASC) VISIBLE,
  INDEX `fk_heart_user1_idx` (`user_tsid` ASC) VISIBLE,
  CONSTRAINT `fk_heart_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_heart_user1`
    FOREIGN KEY (`user_tsid`)
    REFERENCES `poppin`.`user` (`user_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`review`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`review` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `popup_id` INT NOT NULL,
  `user_tsid` BIGINT NOT NULL,
  `rating` FLOAT NOT NULL,
  `title` VARCHAR(50) NOT NULL,
  `thumnail` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  PRIMARY KEY (`review_id`),
  INDEX `fk_review_popup1_idx` (`popup_id` ASC) VISIBLE,
  INDEX `fk_review_user1_idx` (`user_tsid` ASC) VISIBLE,
  CONSTRAINT `fk_review_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_review_user1`
    FOREIGN KEY (`user_tsid`)
    REFERENCES `poppin`.`user` (`user_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`comment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`comment` (
  `comment_id` INT NOT NULL AUTO_INCREMENT,
  `user_tsid` BIGINT NOT NULL,
  `review_id` INT NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  `parent` INT NOT NULL,
  PRIMARY KEY (`comment_id`),
  INDEX `fk_comment_user1_idx` (`user_tsid` ASC) VISIBLE,
  INDEX `fk_comment_review1_idx` (`review_id` ASC) VISIBLE,
  INDEX `fk_comment_comment1_idx` (`parent` ASC) VISIBLE,
  CONSTRAINT `fk_comment_user1`
    FOREIGN KEY (`user_tsid`)
    REFERENCES `poppin`.`user` (`user_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comment_review1`
    FOREIGN KEY (`review_id`)
    REFERENCES `poppin`.`review` (`review_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comment_comment1`
    FOREIGN KEY (`parent`)
    REFERENCES `poppin`.`comment` (`comment_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`reservation_info`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`reservation_info` (
  `reservation_info_id` INT NOT NULL AUTO_INCREMENT,
  `popup_id` INT NOT NULL,
  `reservation_per_time` INT NOT NULL,
  `reservation_per_person` INT NOT NULL,
  `warning` TEXT NULL,
  `term` INT NOT NULL,
  PRIMARY KEY (`reservation_info_id`),
  INDEX `fk_reservation_info_popup1_idx` (`popup_id` ASC) VISIBLE,
  CONSTRAINT `fk_reservation_info_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`reservation_statement`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`reservation_statement` (
  `reservation_statement_id` INT NOT NULL AUTO_INCREMENT,
  `reservation_statement_name` VARCHAR(16) NULL,
  PRIMARY KEY (`reservation_statement_id`),
  UNIQUE INDEX `reservation_statement_name_UNIQUE` (`reservation_statement_name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`pre_reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`pre_reservation` (
  `pre_reservation_id` INT NOT NULL AUTO_INCREMENT,
  `user_tsid` BIGINT NOT NULL,
  `popup_id` INT NOT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `reservation_count` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT now(),
  `reservation_statement_id` INT NOT NULL,
  PRIMARY KEY (`pre_reservation_id`),
  INDEX `fk_pre_reservation_user1_idx` (`user_tsid` ASC) VISIBLE,
  INDEX `fk_pre_reservation_popup1_idx` (`popup_id` ASC) VISIBLE,
  INDEX `fk_pre_reservation_reservation_statement1_idx` (`reservation_statement_id` ASC) VISIBLE,
  CONSTRAINT `fk_pre_reservation_user1`
    FOREIGN KEY (`user_tsid`)
    REFERENCES `poppin`.`user` (`user_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_pre_reservation_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_pre_reservation_reservation_statement1`
    FOREIGN KEY (`reservation_statement_id`)
    REFERENCES `poppin`.`reservation_statement` (`reservation_statement_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`onsite_reservation`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`onsite_reservation` (
  `onsite_reservation_id` INT NOT NULL AUTO_INCREMENT,
  `popup_id` INT NOT NULL,
  `phone_number` VARCHAR(16) NOT NULL,
  `visited_date` DATE NOT NULL,
  `reservation_statement_id` INT NOT NULL,
  PRIMARY KEY (`onsite_reservation_id`),
  INDEX `fk_onsite_reservation_popup1_idx` (`popup_id` ASC) VISIBLE,
  INDEX `fk_onsite_reservation_reservation_statement1_idx` (`reservation_statement_id` ASC) VISIBLE,
  CONSTRAINT `fk_onsite_reservation_popup1`
    FOREIGN KEY (`popup_id`)
    REFERENCES `poppin`.`popup` (`popup_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_onsite_reservation_reservation_statement1`
    FOREIGN KEY (`reservation_statement_id`)
    REFERENCES `poppin`.`reservation_statement` (`reservation_statement_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `poppin`.`user_consent`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `poppin`.`user_consent` (
  `user_consent_id` INT NOT NULL AUTO_INCREMENT,
  `user_tsid` BIGINT NOT NULL,
  `marketing_consent` TINYINT NOT NULL DEFAULT 0,
  `event_push_consent` TINYINT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NULL DEFAULT NOW(),
  PRIMARY KEY (`user_consent_id`),
  INDEX `fk_user_consent_user1_idx` (`user_tsid` ASC) VISIBLE,
  UNIQUE INDEX `user_tsid_UNIQUE` (`user_tsid` ASC) VISIBLE,
  CONSTRAINT `fk_user_consent_user1`
    FOREIGN KEY (`user_tsid`)
    REFERENCES `poppin`.`user` (`user_tsid`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
