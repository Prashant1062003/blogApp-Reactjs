import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Input, Select, RTE } from '../index'
import appwriteService from '../../appwrite/config'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'


function PostForm({ post }) {
  const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      status: post?.status || "active",
    }
  })

  const navigate = useNavigate()
  const userData = useSelector(state => state.user.userData);

  const submit = async (data) => {
    try {
      if (post) {
        const file = await data.image[0] ? appwriteService.uploadFile(data.image[0]) : null

        if (file) {
          appwriteService.deleteFile(post.featuredImage)
        }
        const dbPost = await appwriteService.updatePost(post.$id, {
          ...data,
          featuredImage: file ? file.$id : undefined
        })
        if (dbPost) {
          navigate(`/post/${dbPost.$id}`)
        }
      }
      else {
        const file = await appwriteService.uploadFile(data.image[0]);

        if (file) {
          const fileId = file.$id;
          data.featuredImage = fileId;
          const dbPost = await appwriteService.createPost({
            ...data,
            userId: userData.$id
          })
          if (dbPost) {
            navigate(`/post/${dbPost.$id}`)
          }
        }
      }
    } catch (error) {
      console.error(error)
    }
  }


  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string") {
      return value
        .trim()
        .toLowerCase()
        .replace(/^[a-zA-Z\d\s]+/g, '-')
        .replace(/\s/g, '-')

    }
    return ''
  }, [])

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'title') {
        setValue('slug', slugTransform(value.title), { shouldValidate: true })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch, slugTransform, setValue])


  return (
    <form className='flex flex-wrap' onSubmit={handleSubmit}>
      <div className='w-2/3 px-2'>
        <Input
          label='Title :'
          placeholder='Enter title'
          className='mb-4'
          {...register('title', {
            required: 'Title is required',
            minLength: {
              value: 3,
              message: 'Title must be at least 3 characters long'
            }
          })
          }
        />
        <Input
          label='Slug :'
          placeholder='Enter slug'
          className='mb-4'
          {...register('slug', {
            required: 'Slug is required'
          })}
          onInput={(e) => {
            setValue('slug', slugTransform(e.currentTarget.value), {shouldValidate: true})
          }}
        />
        <RTE label = "content :" name="content" control={control} defaultValue={getValues("content")}/>
      </div>
      <div className='w-1/3 px-2'>
        <Input 
        label = "featured Image :"
        type = "file"
        className = "mb-4"
        accept = "image/png, image/jpg, image/jpeg, image/gif"
        {...register("image", {required: !post})}
        />
        {post && (
          <div className='w-full mb-4'>
            <img 
            src={appwriteService.getfilePreview(post.featuredImage)} 
            alt={post.title} 
            className='rounded-lg'
            />
          </div>
        )}
        <Select
          options={["active", "inactive"]}
          label = "status"
          className = "mb-4"
          {...register("status", {required: true})}
        />
        <Button type="submit" bgColor={post ? "bg-green-500" : undefined} className="w-full">
          {post ? "update" : "submit"}
        </Button>
      </div>
    </form>
  )
}

export default PostForm