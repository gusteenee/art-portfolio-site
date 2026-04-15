import {defineField, defineType} from 'sanity'

export const exhibitPhotoType = defineType({
  name: 'exhibitPhoto',
  title: 'Exhibit Photo',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'year', title: 'Year', type: 'number'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
  ],
})