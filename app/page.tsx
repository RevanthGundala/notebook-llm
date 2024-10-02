"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, User as UserIcon } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

type Post = {
  id: number;
  title: string;
  link: string;
  likes: number;
  author_name: string | null;
  author_image: string | null;
};

export default function Component() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({
    title: "",
    link: "",
    isAnonymous: false,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, login, logout, ready } = usePrivy();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    fetchPosts();
    if (user) {
      setName(user.twitter?.username || user.wallet?.address || "");
      setImage(user.twitter?.profilePictureUrl || "");
    }
  }, [ready, user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("id", { ascending: false });
    if (error) console.log("Error fetching posts:", error);
    else setPosts(data as Post[]);
  };

  const handleLike = async (id: number) => {
    const post = posts.find((post) => post.id === id);
    if (!user) {
      return;
    }
    if (
      post?.author_name === user.twitter?.username ||
      post?.author_name === user.wallet?.address
    ) {
      return;
    }
    if (post) {
      const { error } = await supabase
        .from("posts")
        .update({ likes: post.likes + 1 })
        .eq("id", id);
      if (error) {
        console.log("Error updating likes:", error);
      } else {
        setPosts(
          posts.map((post) =>
            post.id === id ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
    }
  };

  const handleSubmit = async () => {
    const author_name = newPost.isAnonymous
      ? null
      : user?.twitter
      ? user.twitter.username
      : user?.wallet?.address;
    if (newPost.title && newPost.link) {
      const postToInsert = {
        title: newPost.title,
        link: newPost.link,
        likes: 0,
        author_name,
        author_image: image,
      };
      const { error } = await supabase.from("posts").insert([postToInsert]);
      if (error) {
        console.log("Error inserting post:", error);
      } else {
        setNewPost({ title: "", link: "", isAnonymous: false });
        setIsDialogOpen(false);
        // Fetch posts again to include the new post
        fetchPosts();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-800 via-purple-800 to-violet-700">
      <div className="absolute inset-0 bg-grid-white/[0.1] -z-10"></div>
      <header className="bg-gray-700 bg-opacity-80 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            NotebookLLM Podcasts
          </h1>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-100">
                    {name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await logout();
                  }}
                >
                  Sign Out
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                      Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Create a new post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        placeholder="Title"
                        value={newPost.title}
                        onChange={(e) =>
                          setNewPost({ ...newPost, title: e.target.value })
                        }
                        className="bg-gray-600 text-white border-gray-500"
                      />
                      <Input
                        placeholder="Link"
                        value={newPost.link}
                        onChange={(e) =>
                          setNewPost({ ...newPost, link: e.target.value })
                        }
                        className="bg-gray-600 text-white border-gray-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="anonymous"
                          checked={newPost.isAnonymous}
                          onCheckedChange={(checked) =>
                            setNewPost({
                              ...newPost,
                              isAnonymous: checked as boolean,
                            })
                          }
                        />
                        <Label htmlFor="anonymous" className="text-gray-100">
                          Post anonymously
                        </Label>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmit}
                          className="bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Button variant="outline" onClick={() => login()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-700 bg-opacity-80 backdrop-blur-sm shadow-lg sm:rounded-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        {post.author_name ? (
                          <>
                            <Avatar>
                              <AvatarImage
                                src={post.author_image || ""}
                                alt={post.author_name || ""}
                              />
                              <AvatarFallback>
                                {post.author_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-100">
                              {post.author_name}
                            </span>
                          </>
                        ) : (
                          <>
                            <Avatar>
                              <AvatarFallback>
                                <UserIcon className="w-4 h-4 text-gray-300" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-100">
                              Anonymous
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-white">
                        {post.title}
                      </h2>
                      <a
                        href={post.link}
                        className="text-sm text-purple-300 hover:text-purple-200 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {post.link}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="text-pink-300 hover:text-pink-200 hover:bg-gray-600"
                    >
                      <Heart className="w-5 h-5 mr-1" />
                      {post.likes}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
