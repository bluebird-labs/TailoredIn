# TODOS
> List of features, improvements and bugs to look at in this project

## feat: Profile revision

In this session we are revisitng the Profile across all layers.

- the Profile tab should allow editing all fields
- a new "about" section must be added: a narrative text for the user to fill, medium sized text with detailed writing from the user. The text will be used to infer the user's tone later, and more globally define their professional identity
- name should be first name + last name, not just one single field

AC:
- all checks pass
- new e2e tests are added
- all fields can be edited and saved

## feat: phone number format

The phone number of profiles should be rendered in the US format without country code in the PDFs. 

## chore: Populate database from MD file

In this task you will take the content of PROFILE.md and create a database migration to insert / update the data for the unique profile.

- About goes to the profile about data as is
- info should be self explanatory
- education too
- for experiences beyond the obvious location / dates / title / comoany name, you will create one accomplishment per bullet point (put the text in narrative) and generate a short title for each based on the content

