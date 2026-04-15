import {client} from '../../lib/sanity'

async function getIllustrations() {
  return await client.fetch(`
    *[_type == "illustration"]{
      _id,
      title,
      year,
      description,
      "imageUrl": image.asset->url
    }
  `)
}

export default async function IllustrationsPage() {
  const illustrations = await getIllustrations()

  return (
    <main className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-3xl mb-8">Illustrations</h1>

      <div className="grid grid-cols-2 gap-6">
        {illustrations.map((item: any) => (
          <div key={item._id}>
            <img src={item.imageUrl} />
            <p>{item.title}</p>
          </div>
        ))}
      </div>
    </main>
  )
}