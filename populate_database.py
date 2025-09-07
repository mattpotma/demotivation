#!/usr/bin/env python3
"""
Script to populate SQLite database with messages from YAML file.
This script reads messages.yaml and creates/populates a SQLite database.
"""

import sqlite3
import yaml
import os
import sys

def create_database_schema(cursor):
    """Create the messages table with all required columns."""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            motivational INTEGER NOT NULL,
            inspirational INTEGER DEFAULT 0,
            funny INTEGER DEFAULT 0,
            quote INTEGER DEFAULT 0,
            philosophical INTEGER DEFAULT 0,
            daily_affirmation INTEGER DEFAULT 0,
            harsh_truth INTEGER DEFAULT 0,
            workplace INTEGER DEFAULT 0,
            personal_growth INTEGER DEFAULT 0,
            existential INTEGER DEFAULT 0,
            complimentary INTEGER DEFAULT 0
        )
    ''')

def clear_existing_messages(cursor):
    """Clear all existing messages from the database."""
    cursor.execute('DELETE FROM messages')
    print("Cleared existing messages from database.")

def insert_message(cursor, message_data):
    """Insert a single message into the database."""
    # Define all possible tags
    all_tags = [
        'motivational', 'inspirational', 'funny', 'quote', 'philosophical',
        'daily_affirmation', 'harsh_truth', 'workplace', 'personal_growth',
        'existential', 'complimentary'
    ]
    
    # Get tags from message data, default to empty list
    tags = message_data.get('tags', [])
    
    # Build values array based on whether each tag is present
    values = [message_data['message']]
    for tag in all_tags:
        values.append(1 if tag in tags else 0)
    
    cursor.execute('''
        INSERT INTO messages (
            message, motivational, inspirational, funny, quote, philosophical,
            daily_affirmation, harsh_truth, workplace, personal_growth, 
            existential, complimentary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', values)

def main():
    """Main function to populate the database."""
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    yaml_file = os.path.join(script_dir, 'messages.yaml')
    db_file = os.path.join(script_dir, 'demotivation.db')
    
    # Check if YAML file exists
    if not os.path.exists(yaml_file):
        print(f"Error: {yaml_file} not found!")
        sys.exit(1)
    
    # Read YAML file
    try:
        with open(yaml_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error reading YAML file: {e}")
        sys.exit(1)
    
    # Connect to SQLite database
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create schema
        create_database_schema(cursor)
        print("Database schema created/verified.")
        
        # Clear existing messages
        clear_existing_messages(cursor)
        
        # Insert messages
        messages = data.get('messages', [])
        inserted_count = 0
        
        for message_data in messages:
            try:
                insert_message(cursor, message_data)
                inserted_count += 1
            except Exception as e:
                print(f"Error inserting message '{message_data.get('message', 'Unknown')}': {e}")
        
        # Commit changes
        conn.commit()
        print(f"Successfully inserted {inserted_count} messages into the database.")
        
        # Show summary statistics
        cursor.execute('SELECT COUNT(*) FROM messages WHERE motivational = 1')
        motivational_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM messages WHERE motivational = 0')
        demotivational_count = cursor.fetchone()[0]
        
        print(f"Database summary:")
        print(f"  - Motivational messages: {motivational_count}")
        print(f"  - Demotivational messages: {demotivational_count}")
        print(f"  - Total messages: {motivational_count + demotivational_count}")
        print(f"Database file: {db_file}")
        
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    main()