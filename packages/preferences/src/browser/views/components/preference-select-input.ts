// *****************************************************************************
// Copyright (C) 2021 Ericsson and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

import { PreferenceLeafNodeRenderer, PreferenceNodeRenderer } from './preference-node-renderer';
import { injectable, interfaces } from '@theia/core/shared/inversify';
import { JSONValue } from '@theia/core/shared/@phosphor/coreutils';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import { Preference } from '../../util/preference-types';
import { PreferenceLeafNodeRendererContribution } from './preference-node-renderer-creator';
import * as React from '@theia/core/shared/react';
import * as ReactDOM from '@theia/core/shared/react-dom';

@injectable()
export class PreferenceSelectInputRenderer extends PreferenceLeafNodeRenderer<JSONValue, HTMLDivElement> {

    protected readonly onDidChangeEmitter = new Emitter<number>();

    protected get onDidChange(): Event<number> {
        return this.onDidChangeEmitter.event;
    }

    protected get enumValues(): JSONValue[] {
        return this.preferenceNode.preference.data.enum!;
    }

    protected get selectComponentOptions(): SelectOption[] {
        const items: SelectOption[] = [];
        const values = this.enumValues;
        const defaultValue = this.preferenceNode.preference.data.default;
        for (let i = 0; i < values.length; i++) {
            const index = i;
            const value = `${values[i]}`;
            const detail = defaultValue === value ? 'default' : undefined;
            const enumDescription = this.preferenceNode.preference.data.enumDescriptions?.[i];
            const markdownEnumDescription = this.preferenceNode.preference.data.markdownEnumDescriptions?.[i];
            items.push({
                value,
                detail,
                description: enumDescription,
                markdownDescription: markdownEnumDescription,
                onSelected: () => this.handleUserInteraction(index)
            });
        }
        return items;
    }

    protected createInteractable(parent: HTMLElement): void {
        const interactable = document.createElement('div');
        const selectComponent = React.createElement(SelectComponent, {
            options: this.selectComponentOptions,
            selected: this.getDataValue(),
            onDidChange: this.onDidChange
        });
        this.interactable = interactable;
        ReactDOM.render(selectComponent, interactable);
        parent.appendChild(interactable);
    }

    protected getFallbackValue(): JSONValue {
        return this.preferenceNode.preference.data.enum![0];
    }

    protected doHandleValueChange(): void {
        this.updateInspection();
        const newValue = this.getDataValue();
        this.updateModificationStatus(this.getValue());
        if (document.activeElement !== this.interactable) {
            this.onDidChangeEmitter.fire(newValue);
        }
    }

    /**
     * Returns the stringified index corresponding to the currently selected value.
     */
    protected getDataValue(): number {
        const currentValue = this.getValue();
        const selected = this.enumValues.findIndex(value => value === currentValue);
        return selected > -1 ? selected : 0;
    }

    protected handleUserInteraction(selected: number): void {
        const value = this.enumValues[selected];
        this.setPreferenceImmediately(value);
    }
}

@injectable()
export class PreferenceSelectInputRendererContribution extends PreferenceLeafNodeRendererContribution {
    static ID = 'preference-select-input-renderer';
    id = PreferenceSelectInputRendererContribution.ID;

    canHandleLeafNode(node: Preference.LeafNode): number {
        return node.preference.data.enum ? 3 : 0;
    }

    createLeafNodeRenderer(container: interfaces.Container): PreferenceNodeRenderer {
        return container.get(PreferenceSelectInputRenderer);
    }
}
