@version
Feature: Get API version
  Scenario: Get API version
    Given a request for the API version
      When /version API endpoint is called
      Then port "5559" is used
        And version is returned
        And version is cached
