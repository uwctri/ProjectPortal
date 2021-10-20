# ProjectPortal - Redcap External Module

## What does it do?

ProjectPortal allows for the easy creation of modal windows to other forms in the same project or even to other projects on the same or a different redcap instance. This is useful to embed reviewing past forms into a workflow, looking at a record that represents the same subject in a different project, or any number of things

## Installing

This EM isn't yet available to install via redcap's EM database so you'll need to install to your modules folder (i.e. `redcap/modules/\project_portal_v1.0.0`) manually.

## Configuration

Configuration consists of defining a unique class name to attach to use in your project as the button to open the modal, a URL, and some display customizations. The URL supports piping smart variables, data, and some custom features such as the date, offset date, offset date in workdays, and the current URL. Event IDs from other projects will need to be hard coded. You are also given the option to use a direct link rather than a modal, and hide various features of the redcap page (i.e. show only the data entry form in the modal). 

## Call Outs

* You can not use the EM if you have the "change reasons" feature enabled as it causes issues with saving data in the modal

* End-users with very low resolution screens may find this EM more annoying than helpful as the modal window makes their already small screen even smaller