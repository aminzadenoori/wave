// Copyright 2020 H2O.ai, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Fluent from '@fluentui/react'
import React from 'react'
import { stylesheet } from 'typestyle'
import Dialog from './dialog'
import { layoutDefs } from './editing'
import { Logo } from './logo'
import { Layout } from './meta'
import { PageLayout } from './page'
import { B, bond, Box, box, connect, on, Page, qd, S, SockEvent, SockEventType, SockMessageType } from './qd'
import { clas, cssVar, pc, themeB } from './theme'

const
  css = stylesheet({
    app: {
      position: 'absolute',
      left: 0, top: 0, right: 0, bottom: 0,
      backgroundColor: cssVar('$page'),
      color: cssVar('$text'),
      display: 'flex',
      justifyContent: 'center',
      overflow: 'auto'
    },
    centerFullHeight: {
      height: pc(100),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: cssVar('$page'),
      color: cssVar('$text'),
    },
    freeOverlay: {
      display: 'none',
      position: 'fixed',
      left: 0, top: 0, right: 0, bottom: 0,
    },
    busyOverlay: {
      display: 'block',
    },
    waitingOverlay: {
      display: 'flex',
      flexDirection: 'column',
    }
  })

const
  LayoutPicker = bond(({ visibleB }: { visibleB: Box<B> }) => {
    let selectedLayout = layoutDefs[0]
    const
      setLayout = (layout: Layout) => {
        const page = qd.edit()
        page.put('__editor__', { view: 'editor', box: '', title: '' })
        page.put('__meta__', { view: 'meta', box: '', layouts: [layout] })
        page.sync()
      },
      options: Fluent.IChoiceGroupOption[] = layoutDefs.map(({ name: key }) => ({ key, text: key })),
      onChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: Fluent.IChoiceGroupOption) => {
        if (!option) return
        const layout = layoutDefs.find(d => d.name === option.key)
        if (layout) selectedLayout = layout
      },
      accept = () => { setLayout(selectedLayout.layout) },
      cancel = () => { visibleB(false) },
      render = () => {
        return (
          <Fluent.Dialog
            hidden={!visibleB()}
            onDismiss={cancel}
            dialogContentProps={{
              type: Fluent.DialogType.largeHeader,
              title: 'Choose a page layout',
              subText: 'This page will be made editable, and the chosen layout will be applied to the page. ',
            }}
            modalProps={{ isBlocking: false, styles: { main: { maxWidth: 450 } } }}
          >
            <Fluent.ChoiceGroup options={options} defaultSelectedKey={selectedLayout.name} onChange={onChange} />
            <Fluent.DialogFooter>
              <Fluent.DefaultButton onClick={cancel} text="Back to safety" />
              <Fluent.PrimaryButton onClick={accept} text="Apply Layout" />
            </Fluent.DialogFooter>
          </Fluent.Dialog >
        )
      }
    return { render, visibleB }
  }),
  BusyOverlay = bond(() => {
    let
      spinTimeout = 0
    const
      spinDelay = 500, // ms
      busyB = qd.busyB,
      spinB = box(false),
      render = () => (
        <div className={busyB() ? clas(css.freeOverlay, css.busyOverlay) : css.freeOverlay}>
          <Fluent.Spinner className={css.centerFullHeight} style={{ opacity: spinB() ? 0.8 : 0 }} label='Loading...' size={Fluent.SpinnerSize.large} />
        </div>
      )
    on(busyB, busy => {
      window.clearTimeout(spinTimeout)
      if (busy) {
        spinTimeout = window.setTimeout(() => spinB(true), spinDelay)
      } else {
        spinB(false)
      }
    })
    return { render, busyB, spinB }
  }),
  NotFoundOverlay = bond(() => {
    const
      pickingLayoutB = box(false),
      onClick = () => {
        pickingLayoutB(true)
      },
      render = () => {
        return (
          <div className={css.waitingOverlay}>
            <Logo />
            <Fluent.PrimaryButton onClick={onClick}>Edit this page</Fluent.PrimaryButton>
            <LayoutPicker visibleB={pickingLayoutB} />
          </div>
        )
      }
    return { render }
  }),
  App = bond(() => {
    const
      contentB = box<{ page?: Page, error?: S }>({}),
      onSocket = (e: SockEvent) => {
        switch (e.t) {
          case SockEventType.Data:
            contentB({ page: e.page })
            break
          case SockEventType.Message:
            if (e.type === SockMessageType.Err) contentB({ error: e.message })
            break
          case SockEventType.Reset:
            window.location.reload()
            break
        }
      },
      onHashChanged = () => {
        const h = window.location.hash
        if (h?.length > 1) {
          qd.args['#'] = h.substr(1)
        }
        qd.sync()
      },
      init = () => {
        connect('/_s', onSocket)
        window.addEventListener('hashchange', onHashChanged)
      },
      render = () => {
        const { page, error } = contentB()
        // TODO prettier error section
        if (error) {
          const errorMessage = error === 'not_found'
            ? <NotFoundOverlay />
            : error
          return <div className={clas(css.centerFullHeight, css.app)}>{errorMessage}</div>
        }
        if (!page) return <Fluent.Spinner className={css.centerFullHeight} size={Fluent.SpinnerSize.large} label='Loading ...' />

        return (
          <Fluent.Fabric applyTheme>
            <div className={css.app}>
              <PageLayout key={page.key} page={page} />
              <BusyOverlay />
              <Dialog />
            </div>
          </Fluent.Fabric>
        )
      },
      dispose = () => {
        window.removeEventListener('hashchange', onHashChanged)
      }

    return { init, render, dispose, contentB, theme: themeB }
  })

export default App
