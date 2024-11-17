## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Usage & Screenshots](#usage--screenshots)

## Introduction

A full-stack web application providing currency exchange rates, historical data visualization, and currency conversion capabilities. Built with Django REST Framework and React.

## Key Features
- Currency Exchange Rates: Interactive dashboard displaying current rates with trend indicators
- Historical Data Visualization: Interactive charts showing rate trends over multiple time periods
- Currency Calculator: Instant currency conversion with swap functionality
- Responsive Design: Fully responsive interface adapting to all screen sizes

## Technologies Used

### Backend
- Django & Django REST Framework
- PostgreSQL Database

### Frontend
- React.js
- Recharts for data visualization
- Custom CSS for styling


## Project Structure

## Installation & Setup

After fethching the files in repository or cloning the repository(`git clone (https://github.com/alper-sayin/Currency-Exchange-Dashboard.git)`) to desired folder, setting up virtual environment and satisfying the requirements([requirements.txt](requirements.txt)),[package.json)[frontend/package.json], open the terminal in your IDE, you should apply:

### Backend Setup
Run this all commands in project root directory
•	`psql -U postgres`
•	`CREATE DATABASE test_currency_exchange;`
for database creation in your postgresql server
Then,
•	`python manage.py makemigrations`
•	`python manage.py migrate`
for database migrations.
•	`python manage.py load_historical_dates`
for seeding the database with currency exchange rates
After all that our backend is ready for launch
•	`python manage.py runserver`

### Frontend Setup
• Open another terminal in frontend directory
• `npm start` for running the server.
• Server automatically will be launched on http://localhost:3000/ interacting with Django server(http://localhost:8000). 
***Both servers should run simultaneously


## Usage & Screenshots




