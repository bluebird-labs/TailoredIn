# TODOS
> List of features, improvements and bugs to look at in this project

## feat: experiences revisit

The current page in Experiences lists all experiences correctly however it's missing lots of needed UI:
- we should be able to add experiences
- we should be able to edit all details of all experiences, including dates, roles, company names
- right now clicking "Add acconplishment" does not work: it should open a modal
- each experience should be able to save itself (no global save)

Make sure you create a consistent UI / UX.

## feat: phone number format

The phone number of profiles should be rendered in the US format without country code in the PDFs. 

## chore: Populate database from MD file

In this task you will take the content of PROFILE.md and create a database migration to insert / update the data for the unique profile.

- About goes to the profile about data as is
- info should be self explanatory
- education too
- for experiences beyond the obvious location / dates / title / comoany name, you will create one accomplishment per bullet point (put the text in narrative) and generate a short title for each based on the content

