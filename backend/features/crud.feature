@crud
Feature: Get all reminders

	Scenario: Get reminder by ID
		Given that a user wants a reminder by ID
			When /get API endpoint is called with an ID
			Then reminder data is returned

	Scenario: Update reminder
		Given that a user wants to update a reminder
			When /update API endpoint is called with an ID
			Then reminder data is updated

	Scenario: Get all reminders
		Given that a user wants all reminders
			When /get API endpoint is called
			Then all reminders are returned
