<?php

namespace UWMadison\ProjectPortal;

use ExternalModules\AbstractExternalModule;
use REDCap;
use Piping;
use RCView;

class ProjectPortal extends AbstractExternalModule
{
    public function redcap_every_page_top($project_id)
    {
        if (!defined("USERID")) return;
        // Check if EM config page on a project, we need to customize our modal
        if (!$this->isPage('ExternalModules/manager/project.php') || !$project_id) return;
        $this->initializeJavascriptModuleObject();
        $this->passArgument('prefix', $this->getPrefix());
        $this->passArgument('helperButtons', $this->getPipingHelperButtons());
        $this->includeJs('config.js');
    }

    public function redcap_data_entry_form($project_id, $record, $instrument, $event_id, $group_id, $instance)
    {
        $config = $this->parseConfiguration($project_id, $record, $instrument, $event_id, $instance);
        if (!$config) return;
        $this->initializeJavascriptModuleObject();
        $this->passArgument('config', $config);
        $this->includeJs('portal.js');
    }

    private function passArgument($name, $value)
    {
        echo "<script>{$this->getJavascriptModuleObjectName()}.{$name} = " . json_encode($value) . ";</script>";
    }

    private function includeJs($path)
    {
        echo "<script src={$this->getUrl($path)}></script>";
    }

    private function parseConfiguration($project_id, $record, $instrument, $event_id, $instance)
    {
        global $redcap_base_url;
        $settings = $this->getProjectSettings();
        $load = [];

        // Compile a blob to search for class name
        $labelSearch = "";
        $fields = $this->getFieldNames($instrument);
        foreach ($fields as $field) {
            $labelSearch .= $this->getFieldLabel($field);
        }

        foreach ($settings['name'] as $index => $name) {

            // Bail if missing class name setting or in the field blob
            if (empty($name)) continue;
            if (strpos($labelSearch, $name) === false) continue;

            // Save settings, done for normal urls
            $url = $settings['destination'][$index];
            $url = str_replace('[event-id]', $event_id, $url);
            $load[$name] = [
                'url' => $url,
                'width' => $settings['modal-width'][$index],
                'height' => $settings['modal-height'][$index],
                'modal' => $settings['inmodal'][$index] == 1,
                'hide' => $settings['redcap-hide'][$index],
                'hideClose' => $settings['hide-close-button'][$index],
                'hideSave' => $settings['hide-save-button'][$index]
            ];
            if ($settings['isredcap'][$index] != "1") continue;

            // Perform all piping for the URL
            if (Piping::containsSpecialTags($url)) {
                $url = Piping::pipeSpecialTags($url, $project_id, $record, $event_id, $instance);
            }
            if (preg_match('/\[.*\]/', $url, $matches)) {
                foreach ($matches as $match) {
                    $url_event_id = REDCap::getEventIdFromUniqueEvent(trim($match, '[]'));
                    if ($url_event_id)
                        $url = str_replace($match, $url_event_id, $url);
                }
            }

            // Build out rest of URL, including instance
            $url = "{$redcap_base_url}redcap_v" . REDCAP_VERSION . $url;
            if ($settings['isrepeating'][$index] == "1") {
                $url_components = parse_url($url);
                parse_str($url_components['query'], $params);
                $url_instance = 0;
                if (!empty($params['id'])) {
                    $data = REDCap::getData($params['pid'], 'array', $params['id']);
                    $url_instance = intval(end(array_keys($data[$params['id']]['repeat_instances'][$params['event_id']][$params['page']] ?? [])));
                }
                $url = $url . '&instance=' . ($url_instance + 1);
            }

            // Save the final URL
            $load[$name]['url'] = $url;
        }
        return $load;
    }

    private function getPipingHelperButtons()
    {
        global $lang;
        $buttons = [
            'green' => [
                'callback' => 'smartVariableExplainPopup',
                'contents' => '[<i class="fas fa-bolt fa-xs"></i>] ' . $lang['global_146'],
            ],
            'purple' => [
                'callback' => 'pipingExplanation',
                'contents' => RCView::img(['src' => APP_PATH_IMAGES . 'pipe.png']) . $lang['info_41'],
            ]
        ];
        $output = '';
        foreach ($buttons as $color => $btn) {
            $output .= RCView::button(['class' => 'btn btn-xs btn-rc' . $color . ' btn-rc' . $color . '-light', 'onclick' => $btn['callback'] . '(); return false;'], $btn['contents']);
        }
        return RCView::br() . RCView::span(['class' => 'project-portal-piping-helper'], $output);
    }
}
