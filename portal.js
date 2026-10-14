(() => {
    const modal = (id) => `
    <div id="${id}" class="modal pr-0" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close fullscreen" style="font-size:1.3rem" data-bs-toggle="false">
                        <span>&#x26F6;</span>
                    </button>
                    <button type="button" class="close refresh ml-0" style="font-size:1.3rem">
                        <span>&#8635;</span>
                    </button>
                    <button type="button" class="close ml-0" data-bs-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="padding:0;display:flex;justify-content:center;">
                    <div class="iframeLoading" style="align-self:center;color:grey;font-size:16px;">Loading...</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success saveButton">Save & Close</button>
                </div>
            </div>
        </div>
    </div>`

    const tr = () => `
    <tr id="ProjectPortal-tr" sq_id="ProjectPortal">
        <td class="labelrc col-12" colspan="2" style="padding:0;border:0">
        </td>
    </tr>`

    const iframe = (link) => `<iframe style="display:none;width:100%;border:none" src="${link}"></iframe>`

    const em = ExternalModules.UWMadison.ProjectPortal
    const insideModal = window.self !== window.top
    let widthCache = 'auto'
    let loaded = false

    $(document).ready(() => {
        $('form tr').last().after(tr())

        if (require_change_reason && insideModal) {
            Swal.fire({
                icon: 'error',
                title: 'Incompatible Project',
                text: 'Project portal cannot function when using "change reasons" on the target project. Please disable this feature.',
            })
        }

        if (typeof Shazam !== "object") {
            loadPortals()
            return
        }

        let oldCallback = Shazam.beforeDisplayCallback
        Shazam.beforeDisplayCallback = () => {
            if (typeof oldCallback == "function")
                oldCallback()
            loadPortals()
        }
        setTimeout(loadPortals, 1000)
    })

    const loadPortals = () => {
        if (loaded) return
        loaded = true

        // Prevent google chrome bug with hidden forms
        $(window).bind('beforeunload', () => {
            if ($('.modal').is(':visible') === false)
                $(".modal").remove()
        })

        $.each(em.config, (name, config) => {
            if ($(`.${name}`).length == 0) return
            $(`.${name}`).off() // Remove all Redcap events
            config.url = customPipes(config.url)

            // Not a modal, just a boring link
            if (!config.modal) {
                $(`.${name}`).attr('href', config.url)
                $(`.${name}`).on('click', function () {
                    window.location = $(this).attr('href')
                })
                return
            }

            // Stop that pop-up from happening
            if (insideModal) require_change_reason = 0

            // Insert and modify the modal HTML
            $("#ProjectPortal-tr td").append(modal(name))
            if (config.hideClose)
                $(`#${name} .btn-danger`).hide()
            if (config.hideSave)
                $(`#${name} .btn-success`).hide()
            $(`#${name}`).modal({
                show: false,
                backdrop: 'static'
            })

            // Setup our click and events
            $(`.${name}`).on('click', () => $(`#${name}`).modal('show'))
            $(`#${name}`).on('shown.bs.modal', () => $(".modal-open").css("overflow-y", 'auto'))
            $(`#${name}`).on('show.bs.modal', () => showModal(name, config))
        })
    }

    const showModal = (name, config) => {
        const $modal = $(`#${name}`)
        $modal.find('.modal-dialog').css('max-width', parseCSS(config.width, $modal))
        $(window).on('resize', () => {
            let t = $(`#${name} .fullscreen`).data('toggle')
            let h = t ? window.innerHeight : parseCSS(config.height)
            $(`#${name} .modal-dialog`).css('margin-top', t ? 0 : '1.75rem')
            $(`#${name} .modal-dialog`).css('margin-bottom', t ? 0 : '1.75rem')
            $(`#${name} .modal-content`).css('height', h)
        })
        $(window).resize()

        if ($modal.find('iframe').length != 0) return

        $modal.find('.refresh').on('click', function () {
            $(`#${name} iframe`).get(0).contentWindow.location.reload()
        })

        $modal.find('.fullscreen').on('click', () => {
            let t = $(`#${name} .fullscreen`).data('toggle')
            $(`#${name} .fullscreen`).data('toggle', !t)
            if (t) {
                widthCache = $(`#${name} .modal-dialog`).width()
                if (config.hide != 'all')//Only change width if we aren't showing a normal form
                    $(`#${name} .modal-dialog`).css('max-width', `${window.innerWidth}px`)
            } else {
                $(`#${name} .modal-dialog`).css('max-width', parseCSS(config.width, $(`#${name}`)))
            }
            $(`#${name} .modal-dialog`).css('width', t ? "auto" : widthCache)
            $(window).resize()
        })

        $modal.find('.modal-body').append(iframe(config.url))

        $modal.find('iframe').on('load', function () {
            let frameDocument = getFrameDocument(this)

            if (!frameDocument) {
                $(`#${name} .saveButton`).hide()
                $(`#${name} .iframeLoading`).hide()
                $(this).show()
                enableRedcapSaveButtons()
                return
            }

            let content = $(frameDocument)
            if ($(content).find("#header").text() == "Server Error") return
            if (config.hide == 'all') {
                $(content).find('body > :not(#form)').not('.ui-dialog').hide()
                $(content).find('#form').appendTo($(content).find('body'))
                $(content).find('tr[id$=__-tr]').hide()
                $(content).find('html').css('overflow-x', 'hidden')
            } else if (config.hide == 'nav') {
                $(content).find("#west, #south, #subheader, #fade").remove()
            }
            $(`#${name} .iframeLoading`).hide()
            $(this).show()
            if (config.hideSave)
                $(`#${name} .saveButton`).hide()
            else
                $(`#${name} .saveButton`).show()
            enableRedcapSaveButtons()
            $(content).find('input.rc-autocomplete').css('width', 'auto')
            setTimeout(() => {
                $(`#${name}`).find('.modal-dialog').css('max-width', parseCSS(config.width, $(`#${name}`)))
            }, 500)
        })

        $modal.find('.saveButton').on('click', function () {
            let content = $(`#${name} iframe`).contents()

            // Check for required feilds
            let reqFieldMissing = false
            $(content).find('*[req]:visible').each(function () {
                if (reqFieldMissing) return false
                let $input = $(this).find('select,input,textarea')
                if ($input.length == 1) // Select, input, or textarea 
                    reqFieldMissing = $input.val() == ""
                else // checkbox
                    reqFieldMissing = $input.not('*[id]').get().map(x => x.value).every(x => !x)
            })
            if (reqFieldMissing) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Required Fields',
                    text: 'You did not provide a value for some fields that require a value. Please enter a value for the fields marked as required on this page.',
                })
                return
            }

            disableRedcapSaveButtons()
            $(`#${name}`).modal('hide')
            if ($(content).find("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').length != 0) {
                $(`#${name} iframe`).get(0).contentWindow.jQuery("#saveButton, .saveButton").not('.modal #saveButton, .modal .saveButton').click()
            } else {
                $(content).find("#submit-btn-savecontinue").click()
            }
        })
    }

    const enableRedcapSaveButtons = () => {
        $("#__SUBMITBUTTONS__-tr button").css('pointer-events', '')
        $(".modalTempDisableSave").last().remove()
    }

    const disableRedcapSaveButtons = () => {
        $("#__SUBMITBUTTONS__-tr button").css('pointer-events', 'none')
        if ($(".modalTempDisableSave").length > 0)
            $("#questiontable").after(`<div class='modalTempDisableSave d-none'></div>`)
        else
            $("#__SUBMITBUTTONS__-tr button").last().after(`<span class='text-bold text-danger modalTempDisableSave'><br>* Form saving disabled while modal is saved</span>`)
        setTimeout(enableRedcapSaveButtons, 3000)
    }

    const customPipes = (input) => {
        const ymd = 'y-MM-dd'
        input = input.replaceAll("[current-url]", encodeURIComponent(window.location.href))
        input = input.replace(/\[(today|work)([+-]\d+)?\]/g, (match, pipe, offset) => {
            const date = new Date()
            let days = offset ? parseInt(offset, 10) : 0
            if (pipe === 'work') {
                const direction = Math.sign(days)
                while (days !== 0) {
                    date.setDate(date.getDate() + direction)
                    if (date.getDay() !== 0 && date.getDay() !== 6)
                        days -= direction
                }
            } else {
                date.setDate(date.getDate() + days)
            }
            return formatDate(date, ymd)
        })
        return input
    }

    const parseCSS = (setting, $modalWidth) => {
        if (!setting && $modalWidth) {
            const iframeElement = $modalWidth.find('iframe').get(0)
            const frameDocument = iframeElement ? getFrameDocument(iframeElement) : null
            if (!frameDocument)
                return '806px'
            const scrollable = $(frameDocument).height() > ($(iframeElement).height() + 1)
            return scrollable ? '822px' : '806px' // default blank Widths
        }
        setting = setting || '90%' // Default blank Height
        if (setting.includes('%'))
            return Math.floor(($modalWidth ? window.innerWidth : window.innerHeight) * (parseInt(setting.replace('%', '')) / 100)) + "px"
        return setting
    }

    const getFrameDocument = (iframeElement) => {
        try {
            const frameDocument = iframeElement.contentDocument
            if (frameDocument)
                void frameDocument.documentElement
            return frameDocument
        } catch (error) {
            if (error.name !== 'SecurityError')
                throw error
            return null
        }
    }
})()