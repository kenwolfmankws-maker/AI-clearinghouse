# Report Templates Library Setup Guide

## Overview
The Report Templates Library allows users to save, share, and reuse report configurations across the team.

## Features
- **Pre-built Templates**: Weekly Summary, Monthly Deep Dive, Quarterly Review
- **Custom Templates**: Save any report configuration as a reusable template
- **Team Sharing**: Share templates across organization members
- **Template Cloning**: Create new reports from existing templates
- **Template Management**: Edit, duplicate, and delete templates

## Database Setup
Run `DATABASE_TEMPLATE_SETUP.sql` to create:
- `report_templates` table for storing template configurations
- `template_shares` table for team sharing
- RLS policies for secure access

## Pre-built Templates

### Weekly Summary
- Frequency: Weekly
- Format: PDF
- Metrics: Tag Statistics, Top 10 Tags
- Date Range: Last 7 days

### Monthly Deep Dive
- Frequency: Monthly
- Format: PDF
- Metrics: All (Tag Statistics, Top 10 Tags, Usage Over Time)
- Date Range: Last 30 days

### Quarterly Review
- Frequency: Monthly
- Format: PDF
- Metrics: All
- Date Range: Last 90 days

## Usage
1. Navigate to Tag Analytics Dashboard
2. Click "Scheduled Reports" tab
3. Click "Template Library" button
4. Browse or create templates
5. Use "Use Template" to create report from template
