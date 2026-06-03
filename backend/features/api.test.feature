@wip
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

	Scenario: Get cache stats
		Given that a user wants cache stats
			When /stats API endpoint is called
			Then cache stats are returned

  Scenario: Get version
    Given a request for the version
      When /version API endpoint is called
      Then port "5559" is used
        And version is returned
        And version is cached

	Scenario: Test failures
		Given bad requests
			When provided bad input
			Then /add should fail
				And /update should fail
				And /delete should fail

	Scenario: Stringify a ReminderDTO
		Given that a ReminderDTO should stringify
			When a ReminderDTO is output
			Then ReminderDTO should be a string
