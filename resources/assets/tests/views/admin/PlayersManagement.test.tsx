import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { Player, Paginator } from '@/scripts/types'
import PlayersManagement from '@/views/admin/PlayersManagement'

jest.mock('@/scripts/net')

const fixture: Readonly<Player> = Object.freeze<Player>({
  pid: 1,
  name: 'kumiko',
  uid: 1,
  tid_skin: 1,
  tid_cape: 2,
  last_modified: new Date().toString(),
})

function createPaginator(data: Player[]): Paginator<Player> {
  return {
    data,
    total: data.length,
    from: 1,
    to: data.length,
    current_page: 1,
    last_page: 1,
  }
}

test('search players', async () => {
  fetch.get.mockResolvedValue(createPaginator([]))

  const { getByTitle, getByText } = render(<PlayersManagement />)
  await waitFor(() =>
    expect(fetch.get).toBeCalledWith('/admin/players/list', { q: '', page: 1 }),
  )

  fireEvent.input(getByTitle(t('vendor.datatable.search')), {
    target: { value: 's' },
  })
  fireEvent.click(getByText(t('vendor.datatable.search')))
  await waitFor(() =>
    expect(fetch.get).toBeCalledWith('/admin/players/list', {
      q: 's',
      page: 1,
    }),
  )
})

test('preview textures', async () => {
  fetch.get.mockResolvedValue(createPaginator([fixture]))

  const { getByText, queryByAltText } = render(<PlayersManagement />)
  await waitFor(() => expect(fetch.get).toBeCalled())

  fireEvent.click(getByText(t('general.player.previews')))

  expect(
    queryByAltText(`${fixture.name} - ${t('general.skin')}`),
  ).toHaveAttribute('src', `${blessing.base_url}/preview/${fixture.tid_skin}`)
  expect(
    queryByAltText(`${fixture.name} - ${t('general.cape')}`),
  ).toHaveAttribute('src', `${blessing.base_url}/preview/${fixture.tid_cape}`)

  fireEvent.click(getByText(t('general.confirm')))
})

describe('update player name', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixture]))
  })

  it('empty value', async () => {
    const { getByText, getByDisplayValue, queryByText } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changePlayerName')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: '' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    expect(queryByText(t('admin.emptyPlayerName'))).toBeInTheDocument()
    expect(fetch.put).not.toBeCalled()

    fireEvent.click(getByText(t('general.cancel')))

    expect(queryByText(fixture.name)).toBeInTheDocument()
  })

  it('succeeded', async () => {
    fetch.put.mockResolvedValue({ code: 0, message: 'ok' })

    const { getByText, getByDisplayValue, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changePlayerName')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: 'reina' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(`/admin/players/${fixture.pid}/name`, {
        player_name: 'reina',
      }),
    )
    expect(queryByText('ok')).toBeInTheDocument()
    expect(queryByRole('status')).toHaveClass('alert-success')
    expect(queryByText('reina')).toBeInTheDocument()
  })

  it('failed', async () => {
    fetch.put.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByDisplayValue, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changePlayerName')))
    fireEvent.input(getByDisplayValue(fixture.name), {
      target: { value: 'reina' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(`/admin/players/${fixture.pid}/name`, {
        player_name: 'reina',
      }),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(queryByRole('alert')).toHaveClass('alert-danger')
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })
})

describe('update owner', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixture]))
  })

  it('cancelled', async () => {
    const { getByText, queryByText } = render(<PlayersManagement />)

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeOwner')))
    fireEvent.click(getByText(t('general.cancel')))

    expect(fetch.put).not.toBeCalled()
    expect(
      queryByText(`${t('general.player.owner')}: ${fixture.uid}`),
    ).toBeInTheDocument()
  })

  it('succeeded', async () => {
    fetch.put.mockResolvedValue({ code: 0, message: 'ok' })

    const { getByText, getByDisplayValue, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeOwner')))
    fireEvent.input(getByDisplayValue(fixture.uid.toString()), {
      target: { value: '2' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(`/admin/players/${fixture.pid}/owner`, {
        uid: 2,
      }),
    )
    expect(queryByText('ok')).toBeInTheDocument()
    expect(queryByRole('status')).toHaveClass('alert-success')
    expect(queryByText(`${t('general.player.owner')}: 2`)).toBeInTheDocument()
  })

  it('failed', async () => {
    fetch.put.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByDisplayValue, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeOwner')))
    fireEvent.input(getByDisplayValue(fixture.uid.toString()), {
      target: { value: '2' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(`/admin/players/${fixture.pid}/owner`, {
        uid: 2,
      }),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(queryByRole('alert')).toHaveClass('alert-danger')
    expect(
      queryByText(`${t('general.player.owner')}: ${fixture.uid}`),
    ).toBeInTheDocument()
  })
})

describe('update texture', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixture]))
  })

  it('cancelled', async () => {
    const { getByText } = render(<PlayersManagement />)

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeTexture')))
    fireEvent.click(getByText(t('general.cancel')))

    expect(fetch.put).not.toBeCalled()
  })

  it('skin', async () => {
    fetch.put.mockResolvedValue({ code: 0, message: 'ok' })

    const { getByText, getByLabelText, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeTexture')))
    fireEvent.input(getByLabelText('TID'), {
      target: { value: '2' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(
        `/admin/players/${fixture.pid}/textures`,
        {
          type: 'skin',
          tid: 2,
        },
      ),
    )
    expect(queryByText('ok')).toBeInTheDocument()
    expect(queryByRole('status')).toHaveClass('alert-success')
  })

  it('cape', async () => {
    fetch.put.mockResolvedValue({ code: 0, message: 'ok' })

    const { getByText, getByLabelText, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeTexture')))
    fireEvent.click(getByLabelText(t('general.cape')))
    fireEvent.input(getByLabelText('TID'), {
      target: { value: '2' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(
        `/admin/players/${fixture.pid}/textures`,
        {
          type: 'cape',
          tid: 2,
        },
      ),
    )
    expect(queryByText('ok')).toBeInTheDocument()
    expect(queryByRole('status')).toHaveClass('alert-success')
  })

  it('failed', async () => {
    fetch.put.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByLabelText, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.changeTexture')))
    fireEvent.input(getByLabelText('TID'), {
      target: { value: '2' },
    })
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.put).toBeCalledWith(
        `/admin/players/${fixture.pid}/textures`,
        {
          type: 'skin',
          tid: 2,
        },
      ),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(queryByRole('alert')).toHaveClass('alert-danger')
  })
})

describe('delete player', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixture]))
  })

  it('cancelled', async () => {
    const { getByText, queryByText } = render(<PlayersManagement />)

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.deletePlayer')))
    fireEvent.click(getByText(t('general.cancel')))

    expect(fetch.del).not.toBeCalled()
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })

  it('succeeded', async () => {
    fetch.del.mockResolvedValue({ code: 0, message: 'ok' })

    const { getByText, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.deletePlayer')))
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.del).toBeCalledWith(`/admin/players/${fixture.pid}`),
    )
    expect(queryByText('ok')).toBeInTheDocument()
    expect(queryByRole('status')).toHaveClass('alert-success')
    expect(queryByText(fixture.name)).not.toBeInTheDocument()
  })

  it('failed', async () => {
    fetch.del.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, queryByText, queryByRole } = render(
      <PlayersManagement />,
    )

    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByText(t('admin.deletePlayer')))
    fireEvent.click(getByText(t('general.confirm')))

    await waitFor(() =>
      expect(fetch.del).toBeCalledWith(`/admin/players/${fixture.pid}`),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(queryByRole('alert')).toHaveClass('alert-danger')
    expect(queryByText(fixture.name)).toBeInTheDocument()
  })
})
