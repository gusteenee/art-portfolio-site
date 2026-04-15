import {client} from '../../lib/sanity'

async function getAnimations() {
  return await client.fetch(`
    *[_type == "animation"]{
      _id,
      title,
      videoUrl,
      "thumbnail": thumbnail.asset->url
    }
  `)
}

export default async function Page() {
  const animations = await getAnimations()

  return (
    <main className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-3xl mb-8">Animations</h1>

      {animations.map((item: any) => (
        <div key={item._id}>
          <img src={item.thumbnail} />
          <p>{item.title}</p>
        </div>
      ))}
    </main>
  )
}