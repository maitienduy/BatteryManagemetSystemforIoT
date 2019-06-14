-- phpMyAdmin SQL Dump
-- version 4.0.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 07, 2014 at 11:05 AM
-- Server version: 5.5.34
-- PHP Version: 5.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- Database: `test`
--

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE IF NOT EXISTS `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device` varchar(100),
  `time` varchar(100),
  `user` varchar(100),
  `voltage` varchar(100),
  `prob` varchar(100),
  `status` varchar(100),
  `battery` varchar(100),
  `date` varchar(100),
  `power_consumption` varchar(100),
  `estimate_time` varchar(100),
  `battery_type` varchar(100),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6;

--
-- Dumping data for table `devices`
--

-- INSERT INTO `devices` (`id`, `device`, `time`, `voltage`, prob, status, `date`) VALUES
-- (1, 'ESP32', 56380, '2', 'REDLED-on,SERVO-off', 'ON', "2019-5-12 11:12:40");
