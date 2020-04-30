import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import $ from 'jquery'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { ClosetItem, Player, Paginator } from '@/scripts/types'
import Closet from '@/views/user/Closet'

jest.mock('@/scripts/net')

const fixtureSkin: Readonly<ClosetItem> = Object.freeze<ClosetItem>({
  tid: 1,
  name: 'skin',
  type: 'steve',
  hash: 'abc',
  size: 2,
  uploader: 1,
  public: true,
  upload_at: new Date().toString(),
  likes: 1,
  pivot: {
    user_uid: 1,
    texture_tid: 1,
    item_name: 'closet_skin',
  },
})

const fixtureCape: Readonly<ClosetItem> = Object.freeze<ClosetItem>({
  tid: 2,
  name: 'cape',
  type: 'cape',
  hash: 'def',
  size: 2,
  uploader: 1,
  public: true,
  upload_at: new Date().toString(),
  likes: 1,
  pivot: {
    user_uid: 1,
    texture_tid: 2,
    item_name: 'closet_cape',
  },
})

const fixturePlayer: Readonly<Player> = Object.freeze<Player>({
  pid: 1,
  name: 'kumiko',
  uid: 1,
  tid_skin: 1,
  tid_cape: 2,
  last_modified: new Date().toString(),
})

function createPaginator(data: ClosetItem[]): Paginator<ClosetItem> {
  return {
    data,
    total: data.length,
    from: 1,
    to: data.length,
    current_page: 1,
    last_page: 1,
  }
}

beforeEach(() => {
  const container = document.createElement('div')
  container.id = 'previewer'
  document.body.appendChild(container)
})

afterEach(() => {
  document.querySelector('#previewer')!.remove()
})

test('loading indicator', () => {
  fetch.get.mockResolvedValue(createPaginator([]))
  const { queryByTitle } = render(<Closet />)
  expect(queryByTitle('Loading...')).toBeInTheDocument()
})

test('empty closet', async () => {
  fetch.get.mockResolvedValue(createPaginator([]))

  const { queryByText } = render(<Closet />)
  await waitFor(() => expect(fetch.get).toBeCalledTimes(1))
  expect(queryByText(/skin library/i)).toBeInTheDocument()
})

test('categories', async () => {
  fetch.get
    .mockResolvedValueOnce(createPaginator([fixtureSkin]))
    .mockResolvedValueOnce(createPaginator([fixtureCape]))
    .mockResolvedValueOnce(createPaginator([fixtureSkin]))

  const { getByText, queryByText } = render(<Closet />)
  await waitFor(() => expect(fetch.get).toBeCalled())
  expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
  expect(queryByText(fixtureCape.pivot.item_name)).not.toBeInTheDocument()

  fireEvent.click(getByText(t('general.cape')))
  await waitFor(() => expect(fetch.get).toBeCalled())
  expect(queryByText(fixtureSkin.pivot.item_name)).not.toBeInTheDocument()
  expect(queryByText(fixtureCape.pivot.item_name)).toBeInTheDocument()

  fireEvent.click(getByText(t('general.skin')))
  await waitFor(() => expect(fetch.get).toBeCalled())
  expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
  expect(queryByText(fixtureCape.pivot.item_name)).not.toBeInTheDocument()
})

test('search textures', async () => {
  fetch.get
    .mockResolvedValueOnce(createPaginator([fixtureSkin]))
    .mockResolvedValueOnce(createPaginator([]))

  const { getByPlaceholderText, findByText } = render(<Closet />)
  await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

  fireEvent.input(getByPlaceholderText(t('user.typeToSearch')), {
    target: { value: 'abc' },
  })
  expect(await findByText(/no result/i)).toBeInTheDocument()
})

test('switch page', async () => {
  fetch.get
    .mockResolvedValueOnce({ ...createPaginator([]), last_page: 2 })
    .mockResolvedValueOnce({ ...createPaginator([fixtureSkin]), last_page: 2 })

  const { getByText, findByText } = render(<Closet />)
  await waitFor(() => expect(fetch.get).toBeCalledTimes(1))
  fireEvent.click(getByText('2'))
  expect(await findByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
})

describe('rename item', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixtureSkin]))
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByDisplayValue, getByRole, queryByText } = render(
      <Closet />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.renameItem')))
    fireEvent.input(getByDisplayValue(fixtureSkin.pivot.item_name), {
      target: { value: 'my skin' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/closet/rename/${fixtureSkin.tid}`,
        {
          name: 'my skin',
        },
      ),
    )
    expect(queryByText('my skin')).toBeInTheDocument()
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('empty name', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByDisplayValue, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.renameItem')))
    fireEvent.input(getByDisplayValue(fixtureSkin.pivot.item_name), {
      target: { value: '' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(t('skinlib.emptyNewTextureName'))).toBeInTheDocument()

    fireEvent.click(getByText(t('general.cancel')))
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByDisplayValue, getByRole, queryByText } = render(
      <Closet />,
    )
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.renameItem')))
    fireEvent.input(getByDisplayValue(fixtureSkin.pivot.item_name), {
      target: { value: 'my skin' },
    })
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/closet/rename/${fixtureSkin.tid}`,
        {
          name: 'my skin',
        },
      ),
    )
    expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('cancelled', async () => {
    const { getByText, getByDisplayValue, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.renameItem')))
    fireEvent.input(getByDisplayValue(fixtureSkin.pivot.item_name), {
      target: { value: 'my skin' },
    })
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
  })
})

describe('remove item', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixtureSkin]))
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.removeItem')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/closet/remove/${fixtureSkin.tid}`,
      ),
    )
    expect(queryByText(/skin library/i)).toBeInTheDocument()
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByRole, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.removeItem')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/closet/remove/${fixtureSkin.tid}`,
      ),
    )
    expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('cancelled', async () => {
    const { getByText, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.removeItem')))
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
    expect(queryByText(fixtureSkin.pivot.item_name)).toBeInTheDocument()
  })
})

describe('select textures', () => {
  beforeEach(() => {
    fetch.get
      .mockResolvedValueOnce(createPaginator([fixtureSkin]))
      .mockResolvedValueOnce(createPaginator([fixtureCape]))
  })

  it('select skin', async () => {
    const { getByAltText, queryAllByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    expect(queryAllByText(t('general.skin'))).toHaveLength(2)
  })

  it('select cape', async () => {
    const { getByText, getByAltText, queryAllByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByText(t('general.cape')))
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByAltText(fixtureCape.pivot.item_name))
    expect(queryAllByText(t('general.cape'))).toHaveLength(2)
  })

  it('reset selected', async () => {
    const { getByText, getByAltText, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    fireEvent.click(getByText(t('general.cape')))
    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByAltText(fixtureCape.pivot.item_name))

    expect(
      queryByText(`${t('general.skin')} & ${t('general.cape')}`),
    ).toBeInTheDocument()

    fireEvent.click(getByText(t('user.resetSelected')))
    expect(
      queryByText(`${t('general.skin')} & ${t('general.cape')}`),
    ).not.toBeInTheDocument()
  })
})

describe('set avatar', () => {
  beforeEach(() => {
    fetch.get.mockResolvedValue(createPaginator([fixtureSkin]))

    const img = document.createElement('img')
    img.alt = 'User Image'
    document.body.appendChild(img)
  })

  afterEach(() => {
    document.querySelector('[alt="User Image"]')!.remove()
  })

  it('succeeded', async () => {
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const { getByText, getByRole, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.setAsAvatar')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith('/user/profile/avatar', {
        tid: fixtureSkin.tid,
      }),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
    expect(document.querySelector('[alt="User Image"]')).toHaveAttribute('src')
  })

  it('failed', async () => {
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const { getByText, getByRole, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.setAsAvatar')))
    fireEvent.click(getByText(t('general.confirm')))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith('/user/profile/avatar', {
        tid: fixtureSkin.tid,
      }),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('cancelled', async () => {
    const { getByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.setAsAvatar')))
    fireEvent.click(getByText(t('general.cancel')))
    await waitFor(() => expect(fetch.post).not.toBeCalled())
  })
})

describe('apply textures to player', () => {
  it('selected nothing', async () => {
    fetch.get.mockResolvedValue(createPaginator([]))

    const { getByText, getByRole, queryByText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByText(t('user.useAs')))

    expect(queryByText(t('user.emptySelectedTexture'))).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-info')
  })

  it('search players', async () => {
    fetch.get
      .mockResolvedValueOnce(createPaginator([fixtureSkin]))
      .mockResolvedValueOnce({ data: [fixturePlayer] })

    const {
      getByText,
      getByAltText,
      getAllByPlaceholderText,
      queryByText,
      findByText,
    } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalledTimes(1))

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    fireEvent.click(getByText(t('user.useAs')))

    expect(await findByText(fixturePlayer.name)).toBeInTheDocument()

    fireEvent.input(getAllByPlaceholderText(t('user.typeToSearch'))[1], {
      target: { value: 'reina' },
    })
    expect(queryByText(fixturePlayer.name)).not.toBeInTheDocument()
  })

  it('succeeded', async () => {
    fetch.get
      .mockResolvedValueOnce(createPaginator([fixtureSkin]))
      .mockResolvedValueOnce({ data: [fixturePlayer] })
    fetch.post.mockResolvedValue({ code: 0, message: 'success' })

    const {
      getByText,
      getByAltText,
      getByTitle,
      getByRole,
      queryByText,
    } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    fireEvent.click(getByText(t('user.useAs')))
    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByTitle(fixturePlayer.name))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/set/${fixturePlayer.pid}`,
        {
          skin: fixtureSkin.tid,
        },
      ),
    )
    expect(queryByText('success')).toBeInTheDocument()
    expect(getByRole('status')).toHaveClass('alert-success')
  })

  it('failed', async () => {
    fetch.get
      .mockResolvedValueOnce(createPaginator([fixtureSkin]))
      .mockResolvedValueOnce({ data: [fixturePlayer] })
    fetch.post.mockResolvedValue({ code: 1, message: 'failed' })

    const {
      getByText,
      getByAltText,
      getByTitle,
      getByRole,
      queryByText,
    } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    fireEvent.click(getByText(t('user.useAs')))
    await waitFor(() => expect(fetch.get).toBeCalled())
    fireEvent.click(getByTitle(fixturePlayer.name))
    await waitFor(() =>
      expect(fetch.post).toBeCalledWith(
        `/user/player/set/${fixturePlayer.pid}`,
        {
          skin: fixtureSkin.tid,
        },
      ),
    )
    expect(queryByText('failed')).toBeInTheDocument()
    expect(getByRole('alert')).toHaveClass('alert-danger')
  })

  it('close dialog', async () => {
    fetch.get
      .mockResolvedValueOnce(createPaginator([fixtureSkin]))
      .mockResolvedValueOnce({ data: [fixturePlayer] })

    const { getByText, getByAltText } = render(<Closet />)
    await waitFor(() => expect(fetch.get).toBeCalled())

    fireEvent.click(getByAltText(fixtureSkin.pivot.item_name))
    fireEvent.click(getByText(t('user.useAs')))
    await waitFor(() => expect(fetch.get).toBeCalled())

    $('#modal-apply').modal('hide').trigger('hidden.bs.modal')

    expect(fetch.post).not.toBeCalled()
  })
})
