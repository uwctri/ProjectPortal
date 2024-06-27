# ProjectPortal - Redcap External Module

## What does it do?

ProjectPortal allows for the easy creation of modal windows to other forms in the same project or even to other projects on the same or a different redcap instance. This is useful to embed reviewing past forms into a workflow, looking at a record that represents the same subject in a different project, or any number of things

## Installing

You can install the module from the REDCap EM repo or drop it directly in your modules folder (i.e. `/modules/project_portal_v1.0.0`) manually.

## Configuration

Configuration consists of defining a unique class name to attach to use in your project as the button to open the modal, a URL, and some display customizations. The URL supports piping smart variables, data, and some custom features such as the date, offset date, offset date in workdays, and the current URL. Event IDs from other projects will need to be hard coded. You are also given the option to use a direct link rather than a modal, and hide various features of the redcap page (i.e. show only the data entry form in the modal).

You will want to add a button to a descriptive field on the form you wish to add the modal to that opens the modal. An example is below, here the unique class name used is "exampleModal"

```html
<button type="button" class="btn btn-primary exampleModal">Open Modal</button>
```

## Call Outs

* You can not use the EM if you have the "change reasons" feature enabled as it causes issues with saving data in the modal

* End-users with very low resolution screens may find this EM more annoying than helpful as the modal window makes their already small screen even smaller
